const pool = require("../config/db");

// Read-only views over Users, UploadedFiles and AuditLog for the admin
// dashboard (Task 26). Every route here sits behind authMiddleware + adminOnly.

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

module.exports = {
    getDashboard,
    listUsers,
    listUploads,
    listAuditLog
};
