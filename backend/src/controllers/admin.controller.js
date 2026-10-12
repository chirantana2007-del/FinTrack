const pool = require("../config/db");
const { logAudit } = require("../services/audit.service");

// Admin console (Task 26): read-only views over Users, UploadedFiles and
// AuditLog, plus database health with two on-demand stored-procedure runs.
// Every route here sits behind authMiddleware + adminOnly.

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 200;
const UPLOAD_STATUSES = ["pending", "processing", "completed", "failed"];
const ROLES = ["user", "admin"];

// LIMIT/OFFSET are inlined as validated integers: mysql2 prepared statements
// reject bound LIMIT parameters on some MySQL versions.
function pagination(query) {
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
    const offset = Math.max(parseInt(query.offset, 10) || 0, 0);
    return { limit, offset, sql: `LIMIT ${limit} OFFSET ${offset}` };
}

function positiveId(value) {
    const id = parseInt(value, 10);
    return Number.isInteger(id) && id > 0 ? id : null;
}

const getDashboard = async (req, res) => {
    const [[totals]] = await pool.execute(
        `SELECT
            (SELECT COUNT(*) FROM Users)                                            AS totalUsers,
            (SELECT COUNT(*) FROM Users WHERE is_active = 1)                        AS activeUsers,
            (SELECT COUNT(*) FROM Users WHERE role = 'admin')                       AS admins,
            (SELECT COUNT(*) FROM Users WHERE created_at >= NOW() - INTERVAL 7 DAY) AS newUsers7d,
            (SELECT COUNT(*) FROM Transactions)                                     AS totalTransactions,
            (SELECT COUNT(*) FROM UploadedFiles)                                    AS totalUploads,
            (SELECT COUNT(*) FROM UploadedFiles WHERE status = 'failed')            AS failedUploads,
            (SELECT COALESCE(SUM(inserted_rows), 0) FROM UploadedFiles
              WHERE status = 'completed')                                           AS rowsImported,
            (SELECT COUNT(*) FROM Subscriptions WHERE is_active = 1)                AS activeSubscriptions,
            (SELECT COUNT(*) FROM AuditLog WHERE action = 'auth.login_failed'
              AND created_at >= NOW() - INTERVAL 1 DAY)                             AS failedLogins24h`
    );

    const [uploadsByStatus] = await pool.execute(
        "SELECT status, COUNT(*) AS count FROM UploadedFiles GROUP BY status ORDER BY status"
    );

    return res.json({ totals, uploadsByStatus });
};

const listUsers = async (req, res) => {
    const page = pagination(req.query);
    const where = [];
    const params = [];

    if (req.query.search) {
        where.push("(u.full_name LIKE ? OR u.email LIKE ?)");
        const term = `%${String(req.query.search).trim()}%`;
        params.push(term, term);
    }
    if (ROLES.includes(req.query.role)) {
        where.push("u.role = ?");
        params.push(req.query.role);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // password_hash is deliberately never selected.
    const [users] = await pool.execute(
        `SELECT u.user_id, u.full_name, u.email, u.role, u.is_active, u.created_at,
                (SELECT COUNT(*) FROM Accounts a WHERE a.user_id = u.user_id) AS account_count,
                (SELECT COUNT(*) FROM Transactions t
                   JOIN Accounts a ON a.account_id = t.account_id
                  WHERE a.user_id = u.user_id)                                AS transaction_count,
                (SELECT COUNT(*) FROM UploadedFiles f WHERE f.user_id = u.user_id) AS upload_count,
                (SELECT MAX(l.created_at) FROM AuditLog l
                  WHERE l.user_id = u.user_id AND l.action = 'auth.login')    AS last_login_at
         FROM Users u
         ${whereSql}
         ORDER BY u.created_at DESC, u.user_id DESC
         ${page.sql}`,
        params
    );

    const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM Users u ${whereSql}`, params);

    return res.json({ users, total, limit: page.limit, offset: page.offset });
};

const listUploads = async (req, res) => {
    const page = pagination(req.query);
    const where = [];
    const params = [];

    if (UPLOAD_STATUSES.includes(req.query.status)) {
        where.push("f.status = ?");
        params.push(req.query.status);
    }
    const userId = positiveId(req.query.user_id);
    if (userId) {
        where.push("f.user_id = ?");
        params.push(userId);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [uploads] = await pool.execute(
        `SELECT f.file_id, f.user_id, u.full_name, u.email, f.account_id, f.original_filename,
                f.status, f.total_rows, f.inserted_rows, f.failed_rows,
                LEFT(f.error_log, 1000) AS error_log, f.uploaded_at, f.processed_at
         FROM UploadedFiles f
         JOIN Users u ON u.user_id = f.user_id
         ${whereSql}
         ORDER BY f.uploaded_at DESC, f.file_id DESC
         ${page.sql}`,
        params
    );

    const [[{ total }]] = await pool.execute(
        `SELECT COUNT(*) AS total FROM UploadedFiles f ${whereSql}`,
        params
    );

    return res.json({ uploads, total, limit: page.limit, offset: page.offset });
};

const listAuditLog = async (req, res) => {
    const page = pagination(req.query);
    const where = [];
    const params = [];

    // "auth" matches every auth.* action; "auth.login" matches exactly.
    if (req.query.action) {
        const action = String(req.query.action).trim();
        if (action.includes(".")) {
            where.push("l.action = ?");
            params.push(action);
        } else {
            where.push("l.action LIKE ?");
            params.push(`${action}.%`);
        }
    }
    const userId = positiveId(req.query.user_id);
    if (userId) {
        where.push("l.user_id = ?");
        params.push(userId);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [entries] = await pool.execute(
        `SELECT l.audit_id, l.user_id, u.full_name, u.email, l.action, l.entity_type,
                l.entity_id, l.details, l.created_at
         FROM AuditLog l
         LEFT JOIN Users u ON u.user_id = l.user_id
         ${whereSql}
         ORDER BY l.created_at DESC, l.audit_id DESC
         ${page.sql}`,
        params
    );

    const [[{ total }]] = await pool.execute(`SELECT COUNT(*) AS total FROM AuditLog l ${whereSql}`, params);

    return res.json({ entries, total, limit: page.limit, offset: page.offset });
};

// ---------------------------------------------------------------------------
// Database health: the DB-side objects (event, routines, trigger) and whether
// MonthlySummary agrees with Transactions. The two POST actions let an admin
// run the stored procedures on demand; both are safe to repeat.
// ---------------------------------------------------------------------------

const INTERVAL_MS = { SECOND: 1e3, MINUTE: 60e3, HOUR: 3600e3, DAY: 86400e3, WEEK: 604800e3 };

// LAST_EXECUTED + interval. Events can't report their next run directly; this
// is exact for fixed-length intervals and null for MONTH/YEAR schedules.
function nextRun(event) {
    const unit = INTERVAL_MS[event.interval_field];
    if (!event.last_executed || !unit || event.status !== "ENABLED") return null;
    const last = new Date(String(event.last_executed).replace(" ", "T"));
    const next = new Date(last.getTime() + Number(event.interval_value) * unit);
    const pad = (n) => String(n).padStart(2, "0");
    return `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())} ${pad(next.getHours())}:${pad(next.getMinutes())}:${pad(next.getSeconds())}`;
}

// Per user and month: totals recomputed from Transactions vs. what
// MonthlySummary holds. Mismatches are counted per user-month so that errors
// in different users can't cancel out in the monthly sums.
const CONSISTENCY_SQL = `
    WITH txn AS (
        SELECT a.user_id, DATE_FORMAT(t.transaction_date, '%Y-%m-01') AS month,
               SUM(IF(t.amount > 0, t.amount, 0)) AS income,
               SUM(IF(t.amount < 0, -t.amount, 0)) AS expense
        FROM Transactions t
        JOIN Accounts a ON a.account_id = t.account_id
        GROUP BY a.user_id, month
    ),
    summary AS (
        SELECT user_id, DATE_FORMAT(period_month, '%Y-%m-01') AS month,
               SUM(total_income) AS income, SUM(total_expense) AS expense
        FROM MonthlySummary
        GROUP BY user_id, month
    ),
    keyset AS (
        SELECT user_id, month FROM txn
        UNION
        SELECT user_id, month FROM summary
    )
    SELECT k.month,
           COUNT(*) AS userMonths,
           ROUND(SUM(COALESCE(txn.income, 0)), 2) AS txnIncome,
           ROUND(SUM(COALESCE(txn.expense, 0)), 2) AS txnExpense,
           ROUND(SUM(COALESCE(summary.income, 0)), 2) AS summaryIncome,
           ROUND(SUM(COALESCE(summary.expense, 0)), 2) AS summaryExpense,
           SUM(ROUND(COALESCE(txn.income, 0), 2) <> ROUND(COALESCE(summary.income, 0), 2)
            OR ROUND(COALESCE(txn.expense, 0), 2) <> ROUND(COALESCE(summary.expense, 0), 2)) AS mismatches
    FROM keyset k
    LEFT JOIN txn ON txn.user_id = k.user_id AND txn.month = k.month
    LEFT JOIN summary ON summary.user_id = k.user_id AND summary.month = k.month
    GROUP BY k.month
    ORDER BY k.month DESC`;

function toMonthStart(value) {
    const match = /^(\d{4})-(0[1-9]|1[0-2])(-\d{2})?$/.exec(String(value || ""));
    return match ? `${match[1]}-${match[2]}-01` : null;
}

async function summaryTotals(month) {
    const [[row]] = await pool.execute(
        `SELECT COUNT(*) AS rows_, ROUND(COALESCE(SUM(total_income), 0), 2) AS income,
                ROUND(COALESCE(SUM(total_expense), 0), 2) AS expense
         FROM MonthlySummary WHERE period_month = ?`,
        [month]
    );
    return { rows: Number(row.rows_), income: Number(row.income), expense: Number(row.expense) };
}

const getDatabaseHealth = async (req, res) => {
    const [[{ scheduler }]] = await pool.query("SELECT @@event_scheduler AS scheduler");

    const [events] = await pool.query(
        `SELECT EVENT_NAME AS name, STATUS AS status, INTERVAL_VALUE AS interval_value,
                INTERVAL_FIELD AS interval_field, LAST_EXECUTED AS last_executed,
                EVENT_DEFINITION AS definition
         FROM information_schema.EVENTS
         WHERE EVENT_SCHEMA = DATABASE()
         ORDER BY EVENT_NAME`
    );

    const [routines] = await pool.query(
        `SELECT ROUTINE_NAME AS name, ROUTINE_TYPE AS type, CREATED AS created
         FROM information_schema.ROUTINES
         WHERE ROUTINE_SCHEMA = DATABASE()
         ORDER BY ROUTINE_TYPE, ROUTINE_NAME`
    );

    const [triggers] = await pool.query(
        `SELECT TRIGGER_NAME AS name, ACTION_TIMING AS timing, EVENT_MANIPULATION AS event,
                EVENT_OBJECT_TABLE AS table_name
         FROM information_schema.TRIGGERS
         WHERE TRIGGER_SCHEMA = DATABASE()
         ORDER BY TRIGGER_NAME`
    );

    const [consistency] = await pool.query(CONSISTENCY_SQL);

    return res.json({
        scheduler,
        serverTime: (await pool.query("SELECT NOW() AS now"))[0][0].now,
        events: events.map((e) => ({ ...e, next_run: nextRun(e) })),
        routines,
        triggers,
        consistency: consistency.map((row) => ({
            month: row.month,
            userMonths: Number(row.userMonths),
            txnIncome: Number(row.txnIncome),
            txnExpense: Number(row.txnExpense),
            summaryIncome: Number(row.summaryIncome),
            summaryExpense: Number(row.summaryExpense),
            mismatches: Number(row.mismatches)
        }))
    });
};

// Same work the hourly event does, run now for every user.
const runDueCheck = async (req, res) => {
    const countSql = "SELECT COUNT(*) AS n FROM Notifications WHERE type = 'subscription_due'";
    const [[before]] = await pool.query(countSql);
    await pool.query("CALL sp_check_upcoming_subscriptions(NULL)");
    const [[after]] = await pool.query(countSql);
    const created = Number(after.n) - Number(before.n);

    await logAudit({ userId: req.user.id, action: "admin.run_due_check", details: { created } });

    return res.json({ created });
};

// Rebuilds one month's MonthlySummary rows for every user with data in it.
const rebuildSummary = async (req, res) => {
    const month = toMonthStart(req.body.month);
    if (!month) {
        return res.status(400).json({ message: "month (YYYY-MM) is required" });
    }

    // Users with transactions that month, plus any with summary rows for it
    // (so stale rows for a month whose transactions were removed get cleared).
    const [users] = await pool.execute(
        `SELECT DISTINCT a.user_id
         FROM Transactions t JOIN Accounts a ON a.account_id = t.account_id
         WHERE t.transaction_date >= ? AND t.transaction_date < ? + INTERVAL 1 MONTH
         UNION
         SELECT DISTINCT user_id FROM MonthlySummary WHERE period_month = ?`,
        [month, month, month]
    );

    const before = await summaryTotals(month);
    for (const { user_id: userId } of users) {
        await pool.query("CALL sp_generate_monthly_summary(?, ?)", [userId, month]);
    }
    const after = await summaryTotals(month);

    await logAudit({
        userId: req.user.id,
        action: "admin.rebuild_summary",
        details: { month: month.slice(0, 7), users: users.length, before, after }
    });

    return res.json({ month, users: users.length, before, after });
};

module.exports = {
    getDashboard,
    listUsers,
    listUploads,
    listAuditLog,
    getDatabaseHealth,
    runDueCheck,
    rebuildSummary
};
