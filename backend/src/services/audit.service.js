const pool = require("../config/db");

// Records an event in AuditLog for the admin dashboard. Best-effort by
// design: auditing must never make the action being audited fail, so errors
// are logged and swallowed.
const logAudit = async (
  { userId = null, action, entityType = null, entityId = null, details = null },
  conn = pool
) => {
  try {
    await conn.execute(
      `INSERT INTO AuditLog (user_id, action, entity_type, entity_id, details)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, action, entityType, entityId, details === null ? null : JSON.stringify(details)]
    );
  } catch (err) {
    console.error(`Audit log write failed (${action}):`, err.message);
  }
};

module.exports = { logAudit };
