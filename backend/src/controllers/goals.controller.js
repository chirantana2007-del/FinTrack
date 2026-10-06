const pool = require("../config/db");

// Goals are owned by the authenticated user only.
exports.getGoals = async (req, res) => {
    const [goals] = await pool.query(
        `SELECT goal_id AS id, name, target_amount, current_amount, target_date, status
         FROM Goals
         WHERE user_id = ?
         ORDER BY created_at DESC`,
        [req.user.id]
    );

    res.json({ success: true, data: goals });
};

exports.addContribution = async (req, res) => {
    const amount = Number(req.body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ success: false, message: "amount must be a positive number" });
    }

    const [result] = await pool.query(
        `UPDATE Goals
         SET current_amount = current_amount + ?
         WHERE goal_id = ? AND user_id = ?`,
        [amount, req.params.goalId, req.user.id]
    );
    if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Goal not found" });
    }

    res.json({ success: true, message: "Contribution added" });
};
