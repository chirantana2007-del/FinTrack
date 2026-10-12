const pool = require("../config/db");

// Unusual-transaction detection. Two statistical rules are applied to each
// expense category's history, and a transaction is flagged if either fires:
//
//   Z-score  spent is more than Z_THRESHOLD standard deviations above the
//            category mean.
//   IQR      spent is above Q3 + IQR_MULTIPLIER x IQR (the box-plot "upper
//            fence"). Unlike the Z-score it isn't distorted by the outliers it
//            is looking for, so it still works when one huge payment (rent)
//            inflates the mean and standard deviation.
//
// Amounts are stored signed (spending is negative), so every calculation here
// works on `spent`, the positive size of a debit. Comparing raw negative
// amounts against a "high" threshold would never fire.
const Z_THRESHOLD = 2;
const IQR_MULTIPLIER = 1.5;
// Statistics from a handful of transactions are meaningless, and with fewer
// than ~6 samples a Z-score above 2 is mathematically impossible.
const MIN_SAMPLES = 8;

const inr = (value) => `₹${Math.round(value).toLocaleString("en-IN")}`;

function mean(values) {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

// Sample standard deviation (n - 1).
function standardDeviation(values, average) {
  if (values.length < 2) return 0;
  const squares = values.reduce((sum, v) => sum + (v - average) ** 2, 0);
  return Math.sqrt(squares / (values.length - 1));
}

// Percentile by linear interpolation between closest ranks.
function percentile(sorted, p) {
  const position = (sorted.length - 1) * p;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

function categoryStats(amounts) {
  const sorted = [...amounts].sort((a, b) => a - b);
  const average = mean(sorted);
  const q1 = percentile(sorted, 0.25);
  const q3 = percentile(sorted, 0.75);
  const iqr = q3 - q1;
  return {
    count: sorted.length,
    mean: average,
    stdDev: standardDeviation(sorted, average),
    q1,
    q3,
    iqr,
    upperFence: q3 + IQR_MULTIPLIER * iqr
  };
}

// transactions: [{ transaction_id, category_id, category_name, merchant_name,
//                  description, transaction_date, spent }]   (debits, spent > 0)
// Returns every flagged transaction, newest first.
function detectAnomalies(transactions, { minSamples = MIN_SAMPLES } = {}) {
  const byCategory = new Map();
  for (const t of transactions) {
    if (!(t.spent > 0)) continue;
    if (!byCategory.has(t.category_id)) byCategory.set(t.category_id, []);
    byCategory.get(t.category_id).push(t);
  }

  const flagged = [];
  for (const group of byCategory.values()) {
    if (group.length < minSamples) continue;
    const stats = categoryStats(group.map((t) => t.spent));

    for (const t of group) {
      const zScore = stats.stdDev > 0 ? (t.spent - stats.mean) / stats.stdDev : 0;
      const methods = [];
      const reasons = [];

      if (zScore > Z_THRESHOLD) {
        methods.push("z-score");
        reasons.push(
          `${inr(t.spent)} is ${zScore.toFixed(1)} standard deviations above the ${t.category_name} average of ${inr(stats.mean)}.`
        );
      }
      // With IQR = 0 (many identical payments) any different amount would
      // trip the fence, so leave those to the Z-score.
      if (stats.iqr > 0 && t.spent > stats.upperFence) {
        methods.push("iqr");
        reasons.push(
          `${inr(t.spent)} is above the usual ${t.category_name} range (upper limit ${inr(stats.upperFence)}, from the interquartile range).`
        );
      }

      if (methods.length > 0) {
        flagged.push({
          id: t.transaction_id,
          merchant: t.merchant_name || t.description || "Unknown",
          amount: t.spent,
          date: t.transaction_date,
          category: t.category_name,
          methods,
          zScore: Math.round(zScore * 100) / 100,
          upperFence: stats.iqr > 0 ? Math.round(stats.upperFence * 100) / 100 : null,
          reason: reasons.join(" ")
        });
      }
    }
  }

  return flagged.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.amount - a.amount));
}

async function loadUserDebits(userId, conn = pool) {
  const [rows] = await conn.query(
    `SELECT t.transaction_id, t.category_id, c.name AS category_name, m.canonical_name AS merchant_name,
            t.description, t.transaction_date, -t.amount AS spent
     FROM Transactions t
     JOIN Accounts a ON a.account_id = t.account_id
     JOIN Categories c ON c.category_id = t.category_id
     LEFT JOIN Merchants m ON m.merchant_id = t.merchant_id
     WHERE a.user_id = ? AND t.amount < 0 AND c.type = 'expense'`,
    [userId]
  );
  return rows.map((r) => ({ ...r, spent: Number(r.spent) }));
}

async function findUserAnomalies(userId, conn = pool) {
  return detectAnomalies(await loadUserDebits(userId, conn));
}

// Makes Transactions.is_flagged_anomaly match the rules above, so the
// Dashboard's anomaly count and the flags on the Transactions page agree with
// the Insights page. One statement, scoped to the user, touching only rows
// whose flag actually changes. Safe to call repeatedly.
async function syncAnomalyFlags(userId, conn = pool) {
  const anomalies = await findUserAnomalies(userId, conn);
  const ids = anomalies.map((a) => a.id);

  const [result] =
    ids.length === 0
      ? await conn.query(
          `UPDATE Transactions t JOIN Accounts a ON a.account_id = t.account_id
           SET t.is_flagged_anomaly = 0
           WHERE a.user_id = ? AND t.is_flagged_anomaly = 1`,
          [userId]
        )
      : await conn.query(
          `UPDATE Transactions t JOIN Accounts a ON a.account_id = t.account_id
           SET t.is_flagged_anomaly = (t.transaction_id IN (?))
           WHERE a.user_id = ? AND t.is_flagged_anomaly <> (t.transaction_id IN (?))`,
          [ids, userId, ids]
        );

  return { anomalies, changed: result.affectedRows };
}

module.exports = {
  Z_THRESHOLD,
  IQR_MULTIPLIER,
  MIN_SAMPLES,
  detectAnomalies,
  findUserAnomalies,
  syncAnomalyFlags,
  categoryStats,
  percentile
};
