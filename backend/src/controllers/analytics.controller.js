const { resolvePeriod, getMonthlyOverview } = require("../services/analytics.service");

// GET /api/analytics/dashboard[?month=YYYY-MM]
// Defaults to the current month if it has data, otherwise the latest month
// that does. Everything is scoped to the authenticated user.
exports.getDashboard = async (req, res) => {
    const { month, availableMonths } = await resolvePeriod(req.user.id, req.query.month);
    const data = await getMonthlyOverview(req.user.id, month, { availableMonths });
    res.json({ success: true, data });
};
