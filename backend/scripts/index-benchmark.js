// Index performance check (Task 29): shows what the composite indexes in
// schema.sql buy us, using EXPLAIN / EXPLAIN ANALYZE on a realistically sized
// throwaway database.
//
//   npm run bench:indexes
//
// Builds `fintrack_bench_test` from src/db/*.sql, bulk-loads ~200k
// transactions and ~50k notifications, then runs three of the app's real
// query shapes three ways each: with no usable index, with a single-column
// index on the leading column only, and with the composite index. Prints the
// results and writes them to docs/index-performance.md. The dev database is
// never touched, and the bench database is dropped at the end
// (KEEP_BENCH_DB=1 keeps it).
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const { runSqlFile } = require("./lib/sqlLoader");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const DB_NAME = "fintrack_bench_test";
const DB_DIR = path.join(__dirname, "../src/db");
const REPORT_PATH = path.join(__dirname, "../../docs/index-performance.md");

const USERS = 100;
const TRANSACTIONS_PER_USER = 2000;
const NOTIFICATIONS_PER_USER = 500;
const BATCH_SIZE = 2000;
const TIMED_RUNS = 15;
const DATE_FROM = Date.UTC(2025, 0, 1);
const DATE_TO = Date.UTC(2026, 8, 30);
const TARGET_MONTH_START = "2026-09-01";
const TARGET_MONTH_END = "2026-10-01";

const DESCRIPTIONS = [
  "SWIGGY ORDER", "ZOMATO FOOD ORDER", "BIGBASKET GROCERY", "UBER TRIP", "AMAZON.IN ORDER",
  "FLIPKART ORDER", "INDIAN OIL FUEL", "APOLLO PHARMACY", "NETFLIX SUBSCRIPTION", "ELECTRICITY BOARD BILL"
];

// Deterministic pseudo-random numbers so every run loads identical data.
let seed = 42;
function random() {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
}
const pick = (list) => list[Math.floor(random() * list.length)];

function isoDate(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

async function insertInBatches(conn, sqlPrefix, rows) {
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    await conn.query(`${sqlPrefix} VALUES ?`, [rows.slice(i, i + BATCH_SIZE)]);
  }
}

async function buildDatabase(conn) {
  await conn.query(`DROP DATABASE IF EXISTS \`${DB_NAME}\``);
  await conn.query(`CREATE DATABASE \`${DB_NAME}\` CHARACTER SET utf8mb4`);
  await conn.query(`USE \`${DB_NAME}\``);
  // triggers.sql is deliberately skipped: the per-row MonthlySummary trigger
  // would make the bulk load slow, and it has no effect on read query plans.
  for (const file of ["schema.sql", "procedures.sql", "seed.sql"]) {
    await runSqlFile(conn, path.join(DB_DIR, file));
  }

  const [categories] = await conn.query("SELECT category_id FROM Categories WHERE type = 'expense'");
  const categoryIds = categories.map((c) => c.category_id);

  const users = [];
  for (let u = 1; u <= USERS; u += 1) {
    users.push([`Bench User ${u}`, `bench${u}@fintrack.test`, "x"]);
  }
  await insertInBatches(conn, "INSERT INTO Users (full_name, email, password_hash)", users);
  const [userRows] = await conn.query("SELECT user_id FROM Users WHERE email LIKE 'bench%' ORDER BY user_id");
  await insertInBatches(
    conn,
    "INSERT INTO Accounts (user_id, account_name, account_type)",
    userRows.map((u) => [u.user_id, "Primary Account", "bank"])
  );
  const [accounts] = await conn.query("SELECT account_id, user_id FROM Accounts ORDER BY account_id");

  const transactions = [];
  for (const account of accounts) {
    for (let i = 0; i < TRANSACTIONS_PER_USER; i += 1) {
      const income = random() < 0.08;
      const amount = income ? Math.round(1000 + random() * 60000) : -Math.round(20 + random() * 4980);
      transactions.push([
        account.account_id,
        income ? null : pick(categoryIds),
        isoDate(DATE_FROM + random() * (DATE_TO - DATE_FROM)),
        income ? "SALARY CREDIT" : pick(DESCRIPTIONS),
        amount
      ]);
    }
  }
  await insertInBatches(
    conn,
    "INSERT INTO Transactions (account_id, category_id, transaction_date, description, amount)",
    transactions
  );

  const notifications = [];
  for (const user of userRows) {
    for (let i = 0; i < NOTIFICATIONS_PER_USER; i += 1) {
      notifications.push([user.user_id, "budget_alert", "Budget threshold reached", random() < 0.9 ? 1 : 0]);
    }
  }
  await insertInBatches(conn, "INSERT INTO Notifications (user_id, type, message, is_read)", notifications);

  // Single-column indexes on just the leading column, to compare against the
  // composite ones. They exist only in this throwaway database.
  await conn.query("CREATE INDEX idx_bench_account_only ON Transactions (account_id)");
  await conn.query("CREATE INDEX idx_bench_user_only ON Notifications (user_id)");
  await conn.query("ANALYZE TABLE Transactions, Notifications, Accounts");

  return { transactions: transactions.length, notifications: notifications.length, users: userRows.length };
}

// Rows the storage engine actually read, from the Handler_read_* counters.
async function rowsRead(conn, sql, params) {
  await conn.query("FLUSH STATUS");
  await conn.query(sql, params);
  const [status] = await conn.query("SHOW SESSION STATUS LIKE 'Handler_read%'");
  return status.reduce((sum, s) => sum + Number(s.Value), 0);
}

async function medianMs(conn, sql, params) {
  await conn.query(sql, params); // warm-up: buffer pool, plan cache
  await conn.query(sql, params);
  const times = [];
  for (let i = 0; i < TIMED_RUNS; i += 1) {
    const start = process.hrtime.bigint();
    await conn.query(sql, params);
    times.push(Number(process.hrtime.bigint() - start) / 1e6);
  }
  times.sort((a, b) => a - b);
  return times[Math.floor(times.length / 2)];
}

async function measure(conn, label, sql, params) {
  // For the join, report the plan row of the table whose index is under test
  // (aliased t / n), not the Accounts lookup that precedes it.
  const [planRows] = await conn.query(`EXPLAIN ${sql}`, params);
  const plan = planRows.find((row) => row.table === "t" || row.table === "n") || planRows[0];
  const [analyze] = await conn.query(`EXPLAIN ANALYZE ${sql}`, params);
  return {
    label,
    type: plan.type,
    key: plan.key || "(none: full scan)",
    estimatedRows: plan.rows,
    extra: plan.Extra || "",
    rowsRead: await rowsRead(conn, sql, params),
    ms: await medianMs(conn, sql, params),
    analyze: analyze[0].EXPLAIN
  };
}

function scenarios(accountId, userId) {
  const transactionsPage = (hint) => ({
    sql: `SELECT t.transaction_id, t.transaction_date, t.description, t.amount
          FROM Transactions t ${hint}
          WHERE t.account_id = ? AND t.transaction_date >= ? AND t.transaction_date < ?
          ORDER BY t.transaction_date DESC, t.transaction_id DESC
          LIMIT 50`,
    params: [accountId, TARGET_MONTH_START, TARGET_MONTH_END]
  });
  const categorySpend = (hint) => ({
    sql: `SELECT t.category_id, SUM(-t.amount) AS spent
          FROM Accounts a
          JOIN Transactions t ${hint} ON t.account_id = a.account_id
          WHERE a.user_id = ? AND t.amount < 0
            AND t.transaction_date >= ? AND t.transaction_date < ?
          GROUP BY t.category_id`,
    params: [userId, TARGET_MONTH_START, TARGET_MONTH_END]
  });
  const unreadCount = (hint) => ({
    sql: `SELECT COUNT(*) AS unread FROM Notifications n ${hint} WHERE n.user_id = ? AND n.is_read = 0`,
    params: [userId]
  });

  const txnVariants = {
    none: "IGNORE INDEX (idx_transactions_account_date, idx_bench_account_only)",
    single: "FORCE INDEX (idx_bench_account_only)",
    composite: "FORCE INDEX (idx_transactions_account_date)"
  };

  return [
    {
      title: "Transactions page: one account, one month, newest first",
      usedBy: "GET /api/transactions?account_id=&start_date=&end_date= (transactions.controller.js; same WHERE and ORDER BY)",
      index: "idx_transactions_account_date (account_id, transaction_date)",
      variants: Object.entries(txnVariants).map(([k, hint]) => ({ k, ...transactionsPage(hint) }))
    },
    {
      title: "Monthly report: spend per category for one user's month",
      usedBy: "GET /api/reports/summary, GET /api/analytics/dashboard",
      index: "idx_transactions_account_date (account_id, transaction_date)",
      variants: Object.entries(txnVariants).map(([k, hint]) => ({ k, ...categorySpend(hint) }))
    },
    {
      title: "Notification bell: unread count",
      usedBy: "GET /api/notifications (notifications.controller.js)",
      index: "idx_notifications_user_unread (user_id, is_read)",
      variants: Object.entries({
        none: "IGNORE INDEX (idx_notifications_user_unread, idx_bench_user_only)",
        single: "FORCE INDEX (idx_bench_user_only)",
        composite: "FORCE INDEX (idx_notifications_user_unread)"
      }).map(([k, hint]) => ({ k, ...unreadCount(hint) }))
    }
  ];
}

const VARIANT_LABELS = {
  none: "No index",
  single: "Single-column (leading column only)",
  composite: "Composite index"
};

const fmt = (n) => Number(n).toLocaleString("en-IN");
const ms = (n) => (n < 1 ? n.toFixed(3) : n.toFixed(2));

function renderReport({ counts, version, results }) {
  const lines = [
    "# Index Performance Check (Task 29)",
    "",
    "Generated by `npm run bench:indexes` (backend/scripts/index-benchmark.js). Re-run it to refresh these numbers.",
    "",
    "## Setup",
    "",
    `- MySQL ${version}, throwaway database \`${DB_NAME}\` built from \`src/db/schema.sql\`, \`procedures.sql\` and \`seed.sql\`.`,
    `- ${fmt(counts.users)} users, ${fmt(counts.transactions)} transactions (Jan 2025 to Sep 2026), ${fmt(counts.notifications)} notifications.`,
    "- Each query is run three ways using index hints: **no index** (`IGNORE INDEX`), a **single-column** index on the",
    "  leading column only (created just for this comparison), and the **composite** index from `schema.sql` (`FORCE INDEX`).",
    `- **Rows read** = sum of the \`Handler_read_*\` counters for one execution (actual work done by InnoDB).`,
    `- **Time** = median of ${TIMED_RUNS} runs after 2 warm-up runs, measured from Node.js.`,
    ""
  ];

  for (const r of results) {
    const base = r.measurements.find((m) => m.k === "none");
    lines.push(`## ${r.title}`, "", `Used by: ${r.usedBy}. Index under test: \`${r.index}\`.`, "", "```sql", r.variants[2].sql.replace(/\s+/g, " ").replace(/FORCE INDEX \([^)]*\) /, ""), "```", "");
    lines.push("| Variant | Access type | Key used | EXPLAIN Extra | Rows read | Median time | vs. no index |");
    lines.push("|---|---|---|---|---:|---:|---:|");
    for (const m of r.measurements) {
      const speedup = m.k === "none" ? "—" : `${(base.ms / m.ms).toFixed(1)}x faster, ${(base.rowsRead / Math.max(m.rowsRead, 1)).toFixed(0)}x fewer rows`;
      lines.push(`| ${VARIANT_LABELS[m.k]} | \`${m.type}\` | \`${m.key}\` | ${m.extra || "—"} | ${fmt(m.rowsRead)} | ${ms(m.ms)} ms | ${speedup} |`);
    }
    const composite = r.measurements.find((m) => m.k === "composite");
    lines.push("", "<details><summary>EXPLAIN ANALYZE: no index vs. composite</summary>", "", "```", base.analyze.trim(), "", composite.analyze.trim(), "```", "", "</details>", "");
  }

  lines.push(
    "## What this shows",
    "",
    "- **No index:** MySQL has to read every row of the table (`type = ALL`) and throw most of them away, so the",
    "  cost grows with the size of the whole table, not with the size of the answer.",
    "- **Single-column index on the leading column:** jumps straight to one account's (or user's) rows, but then",
    "  still has to read *all* of them and filter on the second condition (the date range / `is_read`) row by row,",
    "  and for the transactions page also sort them (`Using filesort`).",
    "- **Composite index:** both conditions are answered from the index itself.",
    "  - Transactions page: in `(account_id, transaction_date)` one account's entries are stored in date order, so the",
    "    month is a single contiguous `range`. InnoDB secondary indexes also carry the primary key, so the index is",
    "    really ordered by `(account_id, transaction_date, transaction_id)`: `ORDER BY transaction_date DESC,",
    "    transaction_id DESC LIMIT 50` needs no sort. MySQL walks the range backwards (`Backward index scan`, no",
    "    `Using filesort`) and stops after 50 rows.",
    "  - Monthly report: the join looks up the account in the same index and checks the date range inside the index",
    "    (`Using index condition`, index condition pushdown), so only that month's rows are fetched from the table.",
    "  - Notification bell: `(user_id, is_read)` contains every column the count needs, so it is answered from the",
    "    index alone (`Using index`, a covering index) without reading any table rows.",
    "- The upload pipeline's duplicate check (`WHERE account_id = ?`) and the `fk_transactions_account` foreign key",
    "  also use the leftmost column of `idx_transactions_account_date`, so one composite index serves both.",
    ""
  );
  return lines.join("\n");
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    dateStrings: true
  });

  try {
    console.log(`Building ${DB_NAME} (this takes a minute)...`);
    const counts = await buildDatabase(conn);
    const [[{ version }]] = await conn.query("SELECT VERSION() AS version");

    // A user from the middle of the data set, so nothing is at a table edge.
    const [[target]] = await conn.query(
      "SELECT account_id, user_id FROM Accounts ORDER BY account_id LIMIT 1 OFFSET ?",
      [Math.floor(counts.users / 2)]
    );

    const results = [];
    for (const scenario of scenarios(target.account_id, target.user_id)) {
      const measurements = [];
      for (const variant of scenario.variants) {
        measurements.push({ k: variant.k, ...(await measure(conn, variant.k, variant.sql, variant.params)) });
      }
      results.push({ ...scenario, measurements });

      console.log(`\n${scenario.title}`);
      console.table(
        measurements.map((m) => ({
          variant: VARIANT_LABELS[m.k],
          type: m.type,
          key: m.key,
          extra: m.extra,
          rowsRead: m.rowsRead,
          medianMs: Number(ms(m.ms))
        }))
      );
    }

    fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
    fs.writeFileSync(REPORT_PATH, renderReport({ counts, version, results }));
    console.log(`\nReport written to ${path.relative(process.cwd(), REPORT_PATH)}`);
  } finally {
    if (process.env.KEEP_BENCH_DB !== "1") {
      await conn.query(`DROP DATABASE IF EXISTS \`${DB_NAME}\``);
    }
    await conn.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
