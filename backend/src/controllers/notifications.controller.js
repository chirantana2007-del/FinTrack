const pool = require("../config/db");
const { checkUpcomingSubscriptions } = require("../services/notification.service");

const MAX_LIMIT = 100;

const listNotifications = async (req, res) => {
    const unreadOnly = req.query.unread === "1" || req.query.unread === "true";
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), MAX_LIMIT);

    // Refresh due-soon reminders before reading, so the list is current even
    // between runs of the hourly event. A failure here shouldn't hide the
    // notifications that already exist.
    try {
        await checkUpcomingSubscriptions(req.user.id);
    } catch (err) {
        console.error("Upcoming subscription check failed:", err);
    }

    // LIMIT is inlined (validated integer above): mysql2 prepared statements
    // reject a bound LIMIT parameter on some MySQL versions.
    const [notifications] = await pool.execute(
        `SELECT notification_id, type, message, related_entity_type, related_entity_id,
                is_read, created_at
         FROM Notifications
         WHERE user_id = ? ${unreadOnly ? "AND is_read = 0" : ""}
         ORDER BY created_at DESC, notification_id DESC
         LIMIT ${limit}`,
        [req.user.id]
    );

    const [[{ unreadCount }]] = await pool.execute(
        "SELECT COUNT(*) AS unreadCount FROM Notifications WHERE user_id = ? AND is_read = 0",
        [req.user.id]
    );

    return res.json({ notifications, unreadCount });
};

const markNotificationRead = async (req, res) => {
    const [result] = await pool.execute(
        "UPDATE Notifications SET is_read = 1 WHERE notification_id = ? AND user_id = ?",
        [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Notification not found" });
    }

    return res.json({ notification_id: Number(req.params.id), is_read: true });
};

const markAllNotificationsRead = async (req, res) => {
    const [result] = await pool.execute(
        "UPDATE Notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0",
        [req.user.id]
    );

    return res.json({ updated: result.affectedRows });
};

module.exports = {
    listNotifications,
    markNotificationRead,
    markAllNotificationsRead
};
