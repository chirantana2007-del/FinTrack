const pool = require("../config/db");

function normalizeMonth(month) {
    // Accepts 'YYYY-MM' or 'YYYY-MM-DD'; always store/query the 1st of the month.
    if (!month || !/^\d{4}-\d{2}(-\d{2})?$/.test(month)) {
        return null;
    }
    return `${month.slice(0, 7)}-01`;
}

function currentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

// Progress is read from MonthlySummary (maintained by sp_generate_monthly_summary /
// trg_after_transaction_insert) rather than recomputed from Transactions here.
const listBudgets = async (req, res) => {
    const periodMonth = normalizeMonth(req.query.month) || currentMonth();

    const [budgets] = await pool.execute(
        `SELECT b.budget_id, b.category_id, c.name AS category_name, b.period_month, b.limit_amount,
                COALESCE(ms.total_expense, 0) AS spent,
                ROUND(COALESCE(ms.total_expense, 0) / b.limit_amount * 100, 2) AS progress_pct
         FROM Budgets b
         JOIN Categories c ON c.category_id = b.category_id
         LEFT JOIN MonthlySummary ms
           ON ms.user_id = b.user_id AND ms.category_id = b.category_id AND ms.period_month = b.period_month
         WHERE b.user_id = ? AND b.period_month = ?
         ORDER BY c.name`,
        [req.user.id, periodMonth]
    );

    return res.json({ periodMonth, budgets });
};

const createBudget = async (req, res) => {
    const { category_id: categoryId, limit_amount: limitAmount } = req.body;
    const periodMonth = normalizeMonth(req.body.period_month);

    if (!categoryId || !limitAmount || !periodMonth) {
        return res.status(400).json({ message: "category_id, limit_amount, and period_month (YYYY-MM) are required" });
    }
    if (Number(limitAmount) <= 0) {
        return res.status(400).json({ message: "limit_amount must be greater than 0" });
    }

    const [category] = await pool.execute(
        "SELECT category_id FROM Categories WHERE category_id = ? AND (user_id IS NULL OR user_id = ?)",
        [categoryId, req.user.id]
    );
    if (category.length === 0) {
        return res.status(400).json({ message: "category_id does not exist or is not visible to you" });
    }

    try {
        const [result] = await pool.execute(
            "INSERT INTO Budgets (user_id, category_id, period_month, limit_amount) VALUES (?, ?, ?, ?)",
            [req.user.id, categoryId, periodMonth, limitAmount]
        );
        return res.status(201).json({
            message: "Budget created",
            budget: { budget_id: result.insertId, category_id: categoryId, period_month: periodMonth, limit_amount: limitAmount }
        });
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ message: "A budget for this category and month already exists" });
        }
        throw err;
    }
};

const updateBudget = async (req, res) => {
    const { limit_amount: limitAmount } = req.body;
    if (!limitAmount || Number(limitAmount) <= 0) {
        return res.status(400).json({ message: "limit_amount must be greater than 0" });
    }

    const [result] = await pool.execute(
        "UPDATE Budgets SET limit_amount = ? WHERE budget_id = ? AND user_id = ?",
        [limitAmount, req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Budget not found" });
    }
    return res.json({ message: "Budget updated" });
};

const deleteBudget = async (req, res) => {
    const [result] = await pool.execute(
        "DELETE FROM Budgets WHERE budget_id = ? AND user_id = ?",
        [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Budget not found" });
    }
    return res.json({ message: "Budget deleted" });
};

module.exports = { listBudgets, createBudget, updateBudget, deleteBudget };
