const pool = require("../config/db");

const NOTIFICATION_TYPES = ["budget_alert", "subscription_due", "anomaly", "system"];

// Budget alerts are written by trg_after_transaction_insert and due-soon
// reminders by sp_check_upcoming_subscriptions; this is for app-side events.
const createNotification = async (
  userId,
  { type, message, relatedEntityType = null, relatedEntityId = null },
  conn = pool
) => {
  if (!NOTIFICATION_TYPES.includes(type)) {
    throw new Error(`Unknown notification type: ${type}`);
  }

  const [result] = await conn.execute(
    `INSERT INTO Notifications (user_id, type, message, related_entity_type, related_entity_id)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, type, String(message).slice(0, 255), relatedEntityType, relatedEntityId]
  );
  return result.insertId;
};

// Same check the hourly evt_check_upcoming_subscriptions event runs, scoped to
// one user — called on demand so reminders show up without waiting an hour.
const checkUpcomingSubscriptions = async (userId, conn = pool) => {
  await conn.query("CALL sp_check_upcoming_subscriptions(?)", [userId]);
};

module.exports = {
  NOTIFICATION_TYPES,
  createNotification,
  checkUpcomingSubscriptions
};
