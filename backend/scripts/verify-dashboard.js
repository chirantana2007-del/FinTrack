// Checks that the Dashboard agrees with the Transactions page, month by month.
//
//   npm run verify:dashboard                      (demo user)
//   npm run verify:dashboard -- you@example.com yourPassword
//
// Needs the backend running (npm run dev). For every month in the Dashboard's
// month picker it compares, through the same APIs the two pages call:
//   GET /api/analytics/dashboard?month=   (reads MonthlySummary)
//   GET /api/transactions?start_date=&end_date=   (reads Transactions)
// income, expense, transaction count and spend per category.
const BASE = process.env.API_URL || `http://localhost:${process.env.PORT || 4000}/api`;
const [email = "demo@fintrack.dev", password = "password123"] = process.argv.slice(2);

async function api(path, token, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }), ...options.headers }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${options.method || "GET"} ${path} -> ${response.status} ${body.message || ""}`.trim());
  }
  return body;
}

function lastDayOfMonth(monthStart) {
  const [year, month] = monthStart.split("-").map(Number);
  return `${monthStart.slice(0, 8)}${String(new Date(Date.UTC(year, month, 0)).getUTCDate()).padStart(2, "0")}`;
}

async function allTransactions(token, from, to) {
  const rows = [];
  for (let page = 1; ; page += 1) {
    const body = await api(`/transactions?start_date=${from}&end_date=${to}&limit=100&page=${page}`, token);
    rows.push(...body.transactions);
    if (rows.length >= body.total || body.transactions.length === 0) return rows;
  }
}

const round2 = (n) => Math.round(n * 100) / 100;
const close = (a, b) => Math.abs(round2(a) - round2(b)) < 0.01;
const inr = (n) => `₹${round2(n).toLocaleString("en-IN")}`;

async function main() {
  const { token } = await api("/auth/login", null, { method: "POST", body: JSON.stringify({ email, password }) });
  const first = await api("/analytics/dashboard", token);
  const months = first.data.availableMonths;
  console.log(`Checking ${months.length} month(s) for ${email} against ${BASE}\n`);

  let problems = 0;
  const table = [];

  for (const month of months) {
    const { data } = await api(`/analytics/dashboard?month=${month.slice(0, 7)}`, token);
    const txns = await allTransactions(token, month, lastDayOfMonth(month));

    const income = txns.filter((t) => t.amount > 0).reduce((s, t) => s + Number(t.amount), 0);
    const expense = txns.filter((t) => t.amount < 0).reduce((s, t) => s - Number(t.amount), 0);

    // Per-category spend from the Transactions page, vs. the Dashboard's
    // categories plus anything it folded into "Other" (droppedCategories).
    const txnByCategory = new Map();
    for (const t of txns.filter((x) => x.amount < 0)) {
      const key = t.category_name || "Uncategorized";
      txnByCategory.set(key, (txnByCategory.get(key) || 0) - Number(t.amount));
    }
    const dashByCategory = new Map(
      [...(data.categories || []), ...(data.droppedCategories || [])]
        .filter((c) => c.name !== "Other")
        .map((c) => [c.name, Number(c.amount)])
    );
    const categoryMismatches = [...new Set([...txnByCategory.keys(), ...dashByCategory.keys()])].filter(
      (name) => !close(txnByCategory.get(name) || 0, dashByCategory.get(name) || 0)
    );

    const checks = {
      income: close(income, data.totals.income),
      expense: close(expense, data.totals.expense),
      count: txns.length === data.totals.transactionCount,
      categories: categoryMismatches.length === 0
    };
    const ok = Object.values(checks).every(Boolean);
    if (!ok) problems += 1;

    table.push({
      month: month.slice(0, 7),
      "dashboard income": inr(data.totals.income),
      "transactions income": inr(income),
      "dashboard spend": inr(data.totals.expense),
      "transactions spend": inr(expense),
      "dashboard count": data.totals.transactionCount,
      "transactions count": txns.length,
      result: ok ? "OK" : `MISMATCH (${Object.keys(checks).filter((k) => !checks[k]).join(", ")}${categoryMismatches.length ? `: ${categoryMismatches.join(", ")}` : ""})`
    });
  }

  console.table(table);
  console.log(problems === 0 ? "\nAll months match." : `\n${problems} month(s) don't match.`);
  if (problems) process.exitCode = 1;
}

main().catch((err) => {
  console.error("Check failed:", err.message);
  if (/fetch failed|ECONNREFUSED/.test(err.message)) {
    console.error("Is the backend running? Start it with `npm run dev` in backend/.");
  }
  process.exitCode = 1;
});
