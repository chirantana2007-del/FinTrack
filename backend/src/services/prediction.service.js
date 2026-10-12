const pool = require("../config/db");

// Next-month spend forecast: the moving average of the last WINDOW months of
// spending, per category, for the categories the user spends the most in.
//
// Spending is stored as negative amounts, so the SQL below sums -amount over
// debits only (the same definition of "spent" the Dashboard uses), and
// everything here works on positive totals.
const WINDOW = 3;
const TOP_CATEGORIES = 3;
const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const round2 = (value) => Math.round(value * 100) / 100;

function currentMonthKey(now) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(month, withYear) {
  const [year, m] = month.split("-").map(Number);
  return withYear ? `${SHORT_MONTHS[m - 1]} ${String(year).slice(2)}` : SHORT_MONTHS[m - 1];
}

// Percentage change as the signed string the page displays. "New" marks a
// category with spend this month but none the month before (no base to
// divide by).
function trendLabel(latest, previous) {
  if (previous > 0) {
    const change = ((latest - previous) / previous) * 100;
    return `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
  }
  return latest > 0 ? "New" : "+0.0%";
}

// rows: [{ category_name, month: 'YYYY-MM', spent }]  (spent > 0)
function buildForecast(rows, { now = new Date(), topCategories = TOP_CATEGORIES } = {}) {
  const allMonths = [...new Set(rows.map((r) => r.month))].sort().reverse();
  if (allMonths.length === 0) {
    return { predictions: {}, basis: null };
  }

  // A month still in progress would drag the average down, so skip it unless
  // it's the only month there is.
  const current = currentMonthKey(now);
  const completeMonths = allMonths.filter((m) => m !== current);
  const partialMonthExcluded = allMonths.includes(current) && completeMonths.length > 0;
  const usable = partialMonthExcluded ? completeMonths : allMonths;

  const window = usable.slice(0, WINDOW).sort(); // oldest first, for display
  const labels = window.map((m) => monthLabel(m, false));
  const needYears = new Set(labels).size !== labels.length;

  const spendByCategory = new Map();
  for (const r of rows) {
    if (!window.includes(r.month)) continue;
    if (!spendByCategory.has(r.category_name)) spendByCategory.set(r.category_name, {});
    const months = spendByCategory.get(r.category_name);
    months[r.month] = (months[r.month] || 0) + Number(r.spent);
  }

  const forecasts = [...spendByCategory.entries()].map(([category, byMonth]) => {
    const values = window.map((m) => byMonth[m] || 0);
    const average = values.reduce((sum, v) => sum + v, 0) / window.length;
    const months = {};
    window.forEach((m, i) => {
      months[monthLabel(m, needYears)] = round2(values[i]);
    });
    const latest = values[values.length - 1];
    const previous = values.length >= 2 ? values[values.length - 2] : 0;
    return {
      category,
      value: round2(average),
      trend: values.length >= 2 ? trendLabel(latest, previous) : "+0.0%",
      months
    };
  });

  forecasts.sort((a, b) => b.value - a.value);

  const predictions = {};
  for (const f of forecasts.slice(0, topCategories)) {
    predictions[f.category] = { trend: f.trend, value: f.value, months: f.months };
  }

  return {
    predictions,
    basis: { months: window, monthsUsed: window.length, partialMonthExcluded }
  };
}

async function getUserForecast(userId, conn = pool, options) {
  const [rows] = await conn.query(
    `SELECT c.name AS category_name, DATE_FORMAT(t.transaction_date, '%Y-%m') AS month, SUM(-t.amount) AS spent
     FROM Transactions t
     JOIN Accounts a ON a.account_id = t.account_id
     JOIN Categories c ON c.category_id = t.category_id
     WHERE a.user_id = ? AND t.amount < 0 AND c.type = 'expense'
     GROUP BY c.category_id, c.name, month`,
    [userId]
  );
  return buildForecast(rows, options);
}

module.exports = { WINDOW, buildForecast, getUserForecast };
