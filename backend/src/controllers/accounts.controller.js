const pool = require("../config/db");

const ACCOUNT_TYPES = ["bank", "credit_card", "cash", "wallet", "investment"];

const listAccounts = async (req, res) => {
    const [accounts] = await pool.execute(
        `SELECT account_id, account_name, account_type, currency_code, opening_balance, is_active, created_at
         FROM Accounts WHERE user_id = ? ORDER BY created_at`,
        [req.user.id]
    );
    return res.json({ accounts });
};

const getAccount = async (req, res) => {
    const [rows] = await pool.execute(
        `SELECT account_id, account_name, account_type, currency_code, opening_balance, is_active, created_at
         FROM Accounts WHERE account_id = ? AND user_id = ?`,
        [req.params.id, req.user.id]
    );
    if (rows.length === 0) {
        return res.status(404).json({ message: "Account not found" });
    }
    return res.json({ account: rows[0] });
};

const createAccount = async (req, res) => {
    const { account_name: accountName, account_type: accountType, currency_code: currencyCode, opening_balance: openingBalance } = req.body;

    if (!accountName || !accountType) {
        return res.status(400).json({ message: "account_name and account_type are required" });
    }
    if (!ACCOUNT_TYPES.includes(accountType)) {
        return res.status(400).json({ message: `account_type must be one of: ${ACCOUNT_TYPES.join(", ")}` });
    }

    const [result] = await pool.execute(
        `INSERT INTO Accounts (user_id, account_name, account_type, currency_code, opening_balance)
         VALUES (?, ?, ?, ?, ?)`,
        [req.user.id, accountName, accountType, currencyCode || "INR", openingBalance || 0]
    );

    return res.status(201).json({
        message: "Account created",
        account: {
            account_id: result.insertId,
            account_name: accountName,
            account_type: accountType,
            currency_code: currencyCode || "INR",
            opening_balance: openingBalance || 0
        }
    });
};

const updateAccount = async (req, res) => {
    const { account_name: accountName, account_type: accountType, currency_code: currencyCode, opening_balance: openingBalance, is_active: isActive } = req.body;

    if (accountType && !ACCOUNT_TYPES.includes(accountType)) {
        return res.status(400).json({ message: `account_type must be one of: ${ACCOUNT_TYPES.join(", ")}` });
    }

    const [existing] = await pool.execute(
        "SELECT account_id FROM Accounts WHERE account_id = ? AND user_id = ?",
        [req.params.id, req.user.id]
    );
    if (existing.length === 0) {
        return res.status(404).json({ message: "Account not found" });
    }

    await pool.execute(
        `UPDATE Accounts SET
           account_name = COALESCE(?, account_name),
           account_type = COALESCE(?, account_type),
           currency_code = COALESCE(?, currency_code),
           opening_balance = COALESCE(?, opening_balance),
           is_active = COALESCE(?, is_active)
         WHERE account_id = ?`,
        [
            accountName ?? null,
            accountType ?? null,
            currencyCode ?? null,
            openingBalance ?? null,
            isActive === undefined ? null : (isActive ? 1 : 0),
            req.params.id
        ]
    );

    return res.json({ message: "Account updated" });
};

// Soft delete: accounts can carry years of transaction history, so a hard
// DELETE (which would cascade to Transactions/UploadedFiles/etc) is too
// destructive for a single click. Deactivating hides it from active use
// while keeping its transaction history intact.
const deleteAccount = async (req, res) => {
    const [result] = await pool.execute(
        "UPDATE Accounts SET is_active = 0 WHERE account_id = ? AND user_id = ?",
        [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Account not found" });
    }
    return res.json({ message: "Account deactivated" });
};

module.exports = { listAccounts, getAccount, createAccount, updateAccount, deleteAccount };
