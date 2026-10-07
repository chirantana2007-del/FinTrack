const pool = require("../config/db");
const { syncSubscriptions } = require("../services/subscription.service");
const { logAudit } = require("../services/audit.service");

const listSubscriptions = async (req, res) => {
    const includeInactive = req.query.all === "1" || req.query.all === "true";

    const [subscriptions] = await pool.execute(
        `SELECT s.subscription_id, s.merchant_id, m.canonical_name AS merchant_name,
                s.category_id, c.name AS category_name, s.amount, s.cadence,
                s.last_charged_date, s.next_due_date, s.is_active,
                DATEDIFF(s.next_due_date, CURDATE()) AS days_until_due
         FROM Subscriptions s
         JOIN Merchants m ON m.merchant_id = s.merchant_id
         LEFT JOIN Categories c ON c.category_id = s.category_id
         WHERE s.user_id = ? ${includeInactive ? "" : "AND s.is_active = 1"}
         ORDER BY s.next_due_date IS NULL, s.next_due_date, m.canonical_name`,
        [req.user.id]
    );

    const monthlyTotal = subscriptions
        .filter((s) => s.is_active)
        .reduce((sum, s) => sum + (s.cadence === "weekly" ? s.amount * 52 / 12 : s.cadence === "yearly" ? s.amount / 12 : s.amount), 0);

    return res.json({ subscriptions, monthlyTotal: Math.round(monthlyTotal * 100) / 100 });
};

// Manual re-run of detection over the user's full history (uploads already
// trigger this automatically).
const detectSubscriptions = async (req, res) => {
    const detected = await syncSubscriptions(req.user.id);
    return res.json({ detectedCount: detected.length, subscriptions: detected });
};

// Lets the user stop tracking a false positive (or resume tracking it).
// Detection never flips is_active back on by itself.
const updateSubscription = async (req, res) => {
    const { is_active: isActive } = req.body;

    if (typeof isActive !== "boolean") {
        return res.status(400).json({ message: "is_active (boolean) is required" });
    }

    const [result] = await pool.execute(
        "UPDATE Subscriptions SET is_active = ? WHERE subscription_id = ? AND user_id = ?",
        [isActive ? 1 : 0, req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Subscription not found" });
    }

    await logAudit({
        userId: req.user.id,
        action: isActive ? "subscription.resumed" : "subscription.stopped",
        entityType: "Subscription",
        entityId: Number(req.params.id)
    });

    return res.json({ subscription_id: Number(req.params.id), is_active: isActive });
};

module.exports = {
    listSubscriptions,
    detectSubscriptions,
    updateSubscription
};
