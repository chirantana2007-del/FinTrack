const pool = require("../config/db");
const { parseStatement } = require("../services/parsing.service");
const { resolveMerchant } = require("../services/merchant.service");
const { categorizeTransaction } = require("../services/categorization.service");

const uploadCsv = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "CSV file is required" });
  }

  const { account_id: accountId } = req.body;
  if (!accountId) {
    return res.status(400).json({ message: "account_id is required" });
  }

  const userId = req.user.id;

  const [accounts] = await pool.execute(
    "SELECT account_id FROM Accounts WHERE account_id = ? AND user_id = ?",
    [accountId, userId]
  );
  if (accounts.length === 0) {
    return res.status(404).json({ message: "Account not found" });
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

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    for (const row of valid) {
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

    await pool.execute(
      `UPDATE UploadedFiles
       SET status = 'completed', inserted_rows = ?, failed_rows = ?,
           error_log = ?, processed_at = NOW()
       WHERE file_id = ?`,
      [valid.length, errors.length, errors.length > 0 ? JSON.stringify(errors) : null, uploadedFileId]
    );

    return res.status(200).json({
      message: "Upload processed successfully",
      uploadedFileId,
      insertedCount: valid.length,
      failedCount: errors.length,
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
    return res.status(500).json({ message: "Failed to process upload; no rows were saved" });
  } finally {
    connection.release();
  }
};

module.exports = { uploadCsv };
