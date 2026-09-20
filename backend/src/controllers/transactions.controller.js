const pool = require("../config/db");

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 25;

const listTransactions = async (req, res) => {
    const {
        account_id: accountId,
        category_id: categoryId,
        start_date: startDate,
        end_date: endDate,
        search,
        min_amount: minAmount,
        max_amount: maxAmount,
        needs_review: needsReview
    } = req.query;

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_LIMIT));
    const offset = (page - 1) * limit;

    const conditions = ["a.user_id = ?"];
    const params = [req.user.id];

    if (accountId) {
        conditions.push("t.account_id = ?");
        params.push(accountId);
    }
    if (categoryId) {
        conditions.push("t.category_id = ?");
        params.push(categoryId);
    }
    if (startDate) {
        conditions.push("t.transaction_date >= ?");
        params.push(startDate);
    }
    if (endDate) {
        conditions.push("t.transaction_date <= ?");
        params.push(endDate);
    }
    if (search) {
        conditions.push("t.description LIKE ?");
        params.push(`%${search}%`);
    }
    if (minAmount !== undefined) {
        conditions.push("t.amount >= ?");
        params.push(minAmount);
    }
    if (maxAmount !== undefined) {
        conditions.push("t.amount <= ?");
        params.push(maxAmount);
    }
    if (needsReview !== undefined) {
        conditions.push("t.needs_review = ?");
        params.push(needsReview === "true" || needsReview === "1" ? 1 : 0);
    }

    const whereClause = conditions.join(" AND ");

    const [[{ total }]] = await pool.query(
        `SELECT COUNT(*) AS total
         FROM Transactions t
         JOIN Accounts a ON a.account_id = t.account_id
         WHERE ${whereClause}`,
        params
    );

    const [transactions] = await pool.query(
        `SELECT t.transaction_id, t.transaction_date, t.description, t.amount,
                t.needs_review, t.is_flagged_anomaly,
                t.account_id, a.account_name,
                t.category_id, c.name AS category_name,
                t.merchant_id, m.canonical_name AS merchant_name
         FROM Transactions t
         JOIN Accounts a ON a.account_id = t.account_id
         LEFT JOIN Categories c ON c.category_id = t.category_id
         LEFT JOIN Merchants m ON m.merchant_id = t.merchant_id
         WHERE ${whereClause}
         ORDER BY t.transaction_date DESC, t.transaction_id DESC
         LIMIT ? OFFSET ?`,
        [...params, limit, offset]
    );

    return res.json({ transactions, total, page, limit });
};

module.exports = { listTransactions };
