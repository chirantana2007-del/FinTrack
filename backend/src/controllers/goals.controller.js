const pool = require("../config/db");

// Goals are owned by the authenticated user only: every query below is scoped
// by user_id, so another user's goal_id behaves exactly like a missing one.

const GOAL_STATUSES = ["active", "completed", "abandoned"];
const NAME_MAX_LENGTH = 150;
const GOAL_COLUMNS = `goal_id AS id, name, target_amount, current_amount, target_date, status,
                      ROUND(LEAST(current_amount / target_amount * 100, 100), 2) AS progress_pct,
                      created_at, updated_at`;

function todayISO() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

// Accepts a real calendar date in YYYY-MM-DD form (rejects e.g. 2026-02-30).
function isValidDate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function isPositiveAmount(value) {
    const amount = Number(value);
    return value !== "" && value !== null && Number.isFinite(amount) && amount > 0;
}

function isNonNegativeAmount(value) {
    const amount = Number(value);
    return value !== "" && value !== null && Number.isFinite(amount) && amount >= 0;
}

// Validates the fields present in `body`. `requireCore` is true for create,
// where name and target_amount are mandatory. Returns { fields, error }.
function validateGoalInput(body, { requireCore }) {
    const fields = {};

    if (body.name !== undefined || requireCore) {
        const name = typeof body.name === "string" ? body.name.trim() : "";
        if (!name) return { error: "name is required" };
        if (name.length > NAME_MAX_LENGTH) return { error: `name must be at most ${NAME_MAX_LENGTH} characters` };
        fields.name = name;
    }

    if (body.target_amount !== undefined || requireCore) {
        if (!isPositiveAmount(body.target_amount)) return { error: "target_amount must be a number greater than 0" };
        fields.target_amount = Number(body.target_amount);
    }

    if (body.current_amount !== undefined) {
        if (!isNonNegativeAmount(body.current_amount)) return { error: "current_amount must be a number of 0 or more" };
        fields.current_amount = Number(body.current_amount);
    }

    if (body.target_date !== undefined) {
        if (body.target_date === null || body.target_date === "") {
            fields.target_date = null;
        } else if (!isValidDate(body.target_date)) {
            return { error: "target_date must be a valid date in YYYY-MM-DD format" };
        } else {
            fields.target_date = body.target_date;
        }
    }

    if (body.status !== undefined) {
        if (!GOAL_STATUSES.includes(body.status)) return { error: `status must be one of: ${GOAL_STATUSES.join(", ")}` };
        fields.status = body.status;
    }

    return { fields };
}

async function findGoal(goalId, userId) {
    const [rows] = await pool.query(
        `SELECT ${GOAL_COLUMNS} FROM Goals WHERE goal_id = ? AND user_id = ?`,
        [goalId, userId]
    );
    return rows[0] || null;
}

exports.getGoals = async (req, res) => {
    const [goals] = await pool.query(
        `SELECT ${GOAL_COLUMNS}
         FROM Goals
         WHERE user_id = ?
         ORDER BY created_at DESC`,
        [req.user.id]
    );

    res.json({ success: true, data: goals });
};

exports.getGoal = async (req, res) => {
    const goal = await findGoal(req.params.goalId, req.user.id);
    if (!goal) {
        return res.status(404).json({ success: false, message: "Goal not found" });
    }

    res.json({ success: true, data: goal });
};

exports.createGoal = async (req, res) => {
    const { fields, error } = validateGoalInput(req.body, { requireCore: true });
    if (error) {
        return res.status(400).json({ success: false, message: error });
    }
    if (fields.target_date && fields.target_date < todayISO()) {
        return res.status(400).json({ success: false, message: "target_date cannot be in the past" });
    }

    const currentAmount = fields.current_amount ?? 0;
    // A goal created already funded is complete from the start, unless the
    // caller explicitly chose a status.
    const status = fields.status ?? (currentAmount >= fields.target_amount ? "completed" : "active");

    const [result] = await pool.query(
        `INSERT INTO Goals (user_id, name, target_amount, current_amount, target_date, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [req.user.id, fields.name, fields.target_amount, currentAmount, fields.target_date ?? null, status]
    );

    const goal = await findGoal(result.insertId, req.user.id);
    res.status(201).json({ success: true, data: goal });
};

exports.updateGoal = async (req, res) => {
    const { fields, error } = validateGoalInput(req.body, { requireCore: false });
    if (error) {
        return res.status(400).json({ success: false, message: error });
    }
    if (Object.keys(fields).length === 0) {
        return res.status(400).json({
            success: false,
            message: "Provide at least one of: name, target_amount, current_amount, target_date, status"
        });
    }

    const existing = await findGoal(req.params.goalId, req.user.id);
    if (!existing) {
        return res.status(404).json({ success: false, message: "Goal not found" });
    }

    // Reaching the target through an edit completes an active goal, unless
    // the caller set the status explicitly in the same request.
    const target = fields.target_amount ?? Number(existing.target_amount);
    const current = fields.current_amount ?? Number(existing.current_amount);
    if (fields.status === undefined && existing.status === "active" && current >= target) {
        fields.status = "completed";
    }

    // Column names come from validateGoalInput's fixed set, never from input.
    const columns = Object.keys(fields);
    await pool.query(
        `UPDATE Goals SET ${columns.map((column) => `${column} = ?`).join(", ")}
         WHERE goal_id = ? AND user_id = ?`,
        [...columns.map((column) => fields[column]), req.params.goalId, req.user.id]
    );

    const goal = await findGoal(req.params.goalId, req.user.id);
    res.json({ success: true, data: goal });
};

exports.deleteGoal = async (req, res) => {
    const [result] = await pool.query(
        "DELETE FROM Goals WHERE goal_id = ? AND user_id = ?",
        [req.params.goalId, req.user.id]
    );
    if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Goal not found" });
    }

    res.json({ success: true, message: "Goal deleted" });
};

exports.addContribution = async (req, res) => {
    const amount = Number(req.body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ success: false, message: "amount must be a positive number" });
    }

    // MySQL applies single-table SET assignments left to right, so the status
    // check below already sees the new current_amount.
    const [result] = await pool.query(
        `UPDATE Goals
         SET current_amount = current_amount + ?,
             status = IF(status = 'active' AND current_amount >= target_amount, 'completed', status)
         WHERE goal_id = ? AND user_id = ? AND status <> 'abandoned'`,
        [amount, req.params.goalId, req.user.id]
    );
    if (result.affectedRows === 0) {
        const goal = await findGoal(req.params.goalId, req.user.id);
        if (goal) {
            return res.status(409).json({ success: false, message: "Cannot contribute to an abandoned goal" });
        }
        return res.status(404).json({ success: false, message: "Goal not found" });
    }

    const goal = await findGoal(req.params.goalId, req.user.id);
    res.json({ success: true, message: "Contribution added", data: goal });
};
