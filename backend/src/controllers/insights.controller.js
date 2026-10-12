const { getUserForecast } = require("../services/prediction.service");
const { syncAnomalyFlags } = require("../services/anomaly.service");
const { answerQuestion } = require("../services/nlquery.service");

// AI Insights. Every handler works on the authenticated user's own data:
// the routes sit behind authMiddleware, so req.user is always set.
//
// Spending is stored as negative amounts; the services convert to positive
// "spent" values before doing any maths (see their header comments).

const MAX_ANOMALIES_SHOWN = 10;

// GET /api/insights/prediction
exports.getPrediction = async (req, res) => {
    const { predictions, basis } = await getUserForecast(req.user.id);
    res.json({ success: true, predictions, basis });
};

// GET /api/insights/anomalies
// Re-runs the Z-score and IQR rules, makes Transactions.is_flagged_anomaly
// match (so the Dashboard's anomaly count agrees), and returns the most
// recent flagged transactions.
exports.getAnomalies = async (req, res) => {
    const { anomalies, changed } = await syncAnomalyFlags(req.user.id);
    res.json({
        success: true,
        anomalies: anomalies.slice(0, MAX_ANOMALIES_SHOWN),
        totalFlagged: anomalies.length,
        flagsUpdated: changed
    });
};

// POST /api/insights/nl-query   { query }
exports.nlQuery = async (req, res) => {
    const { query } = req.body;
    if (typeof query !== "string" || !query.trim()) {
        return res.status(400).json({ success: false, message: "Query is required" });
    }

    const result = await answerQuestion(query, req.user.id);
    res.json({ success: true, result });
};
