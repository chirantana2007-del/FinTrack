const pool = require("../config/db");
const { parseStatement } = require("../services/parsing.service");
const { resolveMerchant } = require("../services/merchant.service");
const { categorizeTransaction } = require("../services/categorization.service");
const { syncSubscriptions } = require("../services/subscription.service");
const { checkUpcomingSubscriptions } = require("../services/notification.service");
const { logAudit } = require("../services/audit.service");

const uploadCsv = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "CSV file is required" });
  }

  const userId = req.user.id;
  let accountId = req.body.account_id;

  if (accountId) {
    const [accounts] = await pool.execute(
      "SELECT account_id FROM Accounts WHERE account_id = ? AND user_id = ?",
      [accountId, userId]
    );
    if (accounts.length === 0) {
      return res.status(404).json({ message: "Account not found" });
    }
  } else {
    // No account_id supplied (the frontend has no account picker) — fall
    // back to the user's oldest active account, creating one if somehow
    // they don't have one yet (e.g. registered before this default existed).
    const [accounts] = await pool.execute(
      "SELECT account_id FROM Accounts WHERE user_id = ? AND is_active = 1 ORDER BY created_at ASC LIMIT 1",
      [userId]
    );
    if (accounts.length > 0) {
      accountId = accounts[0].account_id;
    } else {
      const [created] = await pool.execute(
        "INSERT INTO Accounts (user_id, account_name, account_type, currency_code) VALUES (?, 'Primary Account', 'bank', 'INR')",
        [userId]
      );
      accountId = created.insertId;
    }
  }

  let parsed;
  try {
    parsed = parseStatement(req.file.buffer.toString("utf-8"));
  } catch (err) {
    return res.status(400).json({ message: err.message || "Failed to parse CSV" });
  }

  const { valid, errors } = parsed;

  const [uploadResult] = await pool.execute(
    `INSERT INTO UploadedFiles (user_id, account_id, original_filename, status, total_rows)
     VALUES (?, ?, ?, 'processing', ?)`,
    [userId, accountId, req.file.originalname, valid.length + errors.length]
  );
  const uploadedFileId = uploadResult.insertId;

  // Re-uploading the same statement (by mistake, or a browser double-click)
  // would otherwise re-insert every row again with no way to tell they're
  // the same transactions. Treat (date, description, amount) on the same
  // account as the identity of a transaction for dedup purposes, and skip
  // rows that already exist — both against what's already in the DB and
  // against repeats within this same file.
  const [existingRows] = await pool.execute(
    "SELECT transaction_date, description, amount FROM Transactions WHERE account_id = ?",
    [accountId]
  );
  const seenKeys = new Set(
    existingRows.map((r) => `${r.transaction_date}|${r.description}|${Number(r.amount)}`)
  );

  const connection = await pool.getConnection();
  const duplicates = [];
  try {
    await connection.beginTransaction();

    for (const row of valid) {
      const key = `${row.transaction_date}|${row.description}|${row.amount}`;
      if (seenKeys.has(key)) {
        duplicates.push(row);
        continue;
      }
      seenKeys.add(key);

      const merchant = await resolveMerchant(row.description, connection);
      const { categoryId, needsReview } = await categorizeTransaction(
        row.description,
        userId,
        connection
      );

      await connection.execute(
        `INSERT INTO Transactions
           (account_id, merchant_id, category_id, uploaded_file_id, transaction_date,
            description, raw_description, amount, needs_review)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          accountId,
          merchant ? merchant.merchant_id : null,
          categoryId,
          uploadedFileId,
          row.transaction_date,
          row.description,
          row.description,
          row.amount,
          needsReview ? 1 : 0
        ]
      );
    }

    await connection.commit();

    const insertedCount = valid.length - duplicates.length;

    await pool.execute(
      `UPDATE UploadedFiles
       SET status = 'completed', inserted_rows = ?, failed_rows = ?,
           error_log = ?, processed_at = NOW()
       WHERE file_id = ?`,
      [insertedCount, errors.length, errors.length > 0 ? JSON.stringify(errors) : null, uploadedFileId]
    );

    // New rows can complete a recurring pattern, so re-run subscription
    // detection and the due-soon check. Best-effort: the rows are already
    // committed, so a failure here must not turn the upload into an error.
    let subscriptionsDetected = 0;
    if (insertedCount > 0) {
      try {
        subscriptionsDetected = (await syncSubscriptions(userId)).length;
        await checkUpcomingSubscriptions(userId);
      } catch (syncErr) {
        console.error("Subscription detection after upload failed:", syncErr);
      }
    }

    await logAudit({
      userId,
      action: "upload.completed",
      entityType: "UploadedFile",
      entityId: uploadedFileId,
      details: {
        filename: req.file.originalname,
        inserted: insertedCount,
        duplicates: duplicates.length,
        failed: errors.length
      }
    });

    return res.status(200).json({
      message: "Upload processed successfully",
      uploadedFileId,
      insertedCount,
      duplicateCount: duplicates.length,
      failedCount: errors.length,
      subscriptionsDetected,
      errors
    });
  } catch (err) {
    await connection.rollback();

    await pool.execute(
      `UPDATE UploadedFiles
       SET status = 'failed', inserted_rows = 0, failed_rows = ?, error_log = ?, processed_at = NOW()
       WHERE file_id = ?`,
      [valid.length + errors.length, err.message || "Unknown error", uploadedFileId]
    );

    console.error("Upload processing error:", err);
    await logAudit({
      userId,
      action: "upload.failed",
      entityType: "UploadedFile",
      entityId: uploadedFileId,
      details: { filename: req.file.originalname, error: err.message || "Unknown error" }
    });
    return res.status(500).json({ message: "Failed to process upload; no rows were saved" });
  } finally {
    connection.release();
  }
};

const HISTORY_LIMIT = 50;

// The signed-in user's own upload history for the Upload page, plus the
// figures its summary strip shows. Admins see everyone's via /api/admin/uploads.
const listMyUploads = async (req, res) => {
  const [uploads] = await pool.execute(
    `SELECT f.file_id, f.original_filename, f.status, f.total_rows, f.inserted_rows, f.failed_rows,
            LEFT(f.error_log, 1000) AS error_log, f.uploaded_at, f.processed_at,
            a.account_name
     FROM UploadedFiles f
     LEFT JOIN Accounts a ON a.account_id = f.account_id
     WHERE f.user_id = ?
     ORDER BY f.uploaded_at DESC, f.file_id DESC
     LIMIT ${HISTORY_LIMIT}`,
    [req.user.id]
  );

  const [[totals]] = await pool.execute(
    `SELECT COUNT(*) AS uploadCount,
            COALESCE(SUM(CASE WHEN status = 'completed' THEN inserted_rows ELSE 0 END), 0) AS rowsImported
     FROM UploadedFiles
     WHERE user_id = ?`,
    [req.user.id]
  );

  const [[{ activeRuleCount }]] = await pool.execute(
    `SELECT COUNT(*) AS activeRuleCount
     FROM CategoryRules
     WHERE is_active = 1 AND (user_id IS NULL OR user_id = ?)`,
    [req.user.id]
  );

  return res.json({ uploads, ...totals, activeRuleCount });
};

module.exports = { uploadCsv, listMyUploads };
