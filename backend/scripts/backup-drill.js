// Backup & recovery drill (Task 30).
//
//   npm run drill:backup
//
// 1. Full backup of the FinTrack database with mysqldump.
// 2. Restore test: load it into a fresh database and verify every table
//    (row count + CHECKSUM TABLE) and every routine, trigger and event.
// 3. Total-loss scenario: drop that database, recover it from the backup,
//    verify again, and time the recovery.
// 4. Point-in-time recovery: from a backup, make some good changes, then an
//    accidental DELETE; recover by restoring the backup and replaying the
//    binary log up to just before the accident.
//
// The real database is only ever read (to back it up). Every destructive
// step runs on throwaway *_test databases, which are dropped at the end
// (KEEP_DRILL_DBS=1 keeps them). Results go to docs/backup-recovery.md.
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const { runFromFile, pipeTools } = require("./lib/mysqlTools");
const { backupDatabase, BACKUP_DIR, timestamp } = require("./lib/backup");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

const SOURCE_DB = process.env.DB_NAME || "fintrack";
const RESTORE_DB = "fintrack_restore_test";
const PITR_DB = "fintrack_pitr_test";
const REPORT_PATH = path.join(__dirname, "../../docs/backup-recovery.md");

for (const name of [RESTORE_DB, PITR_DB]) {
  if (!name.endsWith("_test") || name === SOURCE_DB) {
    throw new Error(`Refusing to use "${name}" as a drill database.`);
  }
}

const checks = [];
function check(step, description, passed, detail = "") {
  checks.push({ step, description, passed: Boolean(passed), detail });
  console.log(`  ${passed ? "PASS" : "FAIL"}  ${description}${detail ? ` (${detail})` : ""}`);
}

const q = (name) => `\`${name.replace(/`/g, "``")}\``;

// Row count + CHECKSUM TABLE for every table, plus the stored objects.
async function fingerprint(conn, db) {
  const [tables] = await conn.query(
    "SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME",
    [db]
  );
  const result = { tables: {}, routines: [], triggers: [], events: [] };
  for (const { name } of tables) {
    const [[{ n }]] = await conn.query(`SELECT COUNT(*) AS n FROM ${q(db)}.${q(name)}`);
    const [[sum]] = await conn.query(`CHECKSUM TABLE ${q(db)}.${q(name)}`);
    result.tables[name.toLowerCase()] = { rows: Number(n), checksum: String(sum.Checksum) };
  }
  const [routines] = await conn.query(
    "SELECT CONCAT(ROUTINE_TYPE, ' ', ROUTINE_NAME) AS name FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = ? ORDER BY 1",
    [db]
  );
  const [triggers] = await conn.query("SELECT TRIGGER_NAME AS name FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = ? ORDER BY 1", [db]);
  const [events] = await conn.query("SELECT EVENT_NAME AS name FROM information_schema.EVENTS WHERE EVENT_SCHEMA = ? ORDER BY 1", [db]);
  result.routines = routines.map((r) => r.name);
  result.triggers = triggers.map((r) => r.name);
  result.events = events.map((r) => r.name);
  return result;
}

function tableDifferences(expected, actual) {
  const names = new Set([...Object.keys(expected.tables), ...Object.keys(actual.tables)]);
  return [...names].filter((name) => {
    const a = expected.tables[name];
    const b = actual.tables[name];
    return !a || !b || a.rows !== b.rows || a.checksum !== b.checksum;
  });
}

const sameList = (a, b) => JSON.stringify(a) === JSON.stringify(b);

async function recreateDatabase(conn, db) {
  await conn.query(`DROP DATABASE IF EXISTS ${q(db)}`);
  // No explicit collation: routines inherit the database default, which must
  // match the tables' (server default) collation.
  await conn.query(`CREATE DATABASE ${q(db)} CHARACTER SET utf8mb4`);
}

async function restore(conn, db, file) {
  const started = Date.now();
  await recreateDatabase(conn, db);
  await runFromFile("mysql", ["--default-character-set=utf8mb4", db], file);
  return Date.now() - started;
}

async function binlogStatus(conn) {
  const [[status]] = await conn.query("SHOW BINARY LOG STATUS");
  return { file: status.File, position: Number(status.Position) };
}

async function databaseExists(conn, db) {
  const [rows] = await conn.query("SELECT 1 FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?", [db]);
  return rows.length > 0;
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    dateStrings: true
  });
  const report = { startedAt: new Date() };
  const tempFiles = [];

  try {
    const [[{ version }]] = await conn.query("SELECT VERSION() AS version");
    const [[settings]] = await conn.query(
      "SELECT @@log_bin AS logBin, @@binlog_format AS format, @@binlog_expire_logs_seconds AS expire"
    );
    report.server = { version, ...settings };
    if (!Number(settings.logBin)) {
      throw new Error("Binary logging is off, so point-in-time recovery can't be demonstrated.");
    }

    // ---------------------------------------------------------------- 1
    console.log(`\n1. Full backup of "${SOURCE_DB}"`);
    const before = await fingerprint(conn, SOURCE_DB);
    const backup = await backupDatabase(SOURCE_DB);
    const after = await fingerprint(conn, SOURCE_DB);
    report.backup = backup;
    report.source = before;
    check(1, "mysqldump completed", fs.existsSync(backup.file), `${(backup.bytes / 1024).toFixed(1)} KB in ${backup.durationMs} ms`);
    check(1, "backup records its binary log position", backup.binlog, backup.binlog && `${backup.binlog.file}:${backup.binlog.position}`);
    check(1, "source database didn't change during the backup", tableDifferences(before, after).length === 0);

    // ---------------------------------------------------------------- 2
    console.log(`\n2. Restore test into "${RESTORE_DB}"`);
    report.restoreMs = await restore(conn, RESTORE_DB, backup.file);
    const restored = await fingerprint(conn, RESTORE_DB);
    report.restored = restored;
    const diff = tableDifferences(before, restored);
    check(2, `all ${Object.keys(before.tables).length} tables match row-for-row (count + CHECKSUM TABLE)`, diff.length === 0, diff.join(", "));
    check(2, "stored function and procedures restored", sameList(before.routines, restored.routines), restored.routines.join(", "));
    check(2, "trigger restored", sameList(before.triggers, restored.triggers), restored.triggers.join(", "));
    check(2, "scheduled event restored", sameList(before.events, restored.events), restored.events.join(", "));
    const probe = "SWIGGY ORDER 48213";
    const [[live]] = await conn.query(`SELECT ${q(SOURCE_DB)}.fn_categorize_transaction(?) AS id`, [probe]);
    const [[copy]] = await conn.query(`SELECT ${q(RESTORE_DB)}.fn_categorize_transaction(?) AS id`, [probe]);
    check(2, "restored categorization function gives the same answer", live.id === copy.id, `"${probe}" -> category ${copy.id}`);

    // ---------------------------------------------------------------- 3
    console.log(`\n3. Total loss: drop "${RESTORE_DB}" and recover it`);
    await conn.query(`DROP DATABASE ${q(RESTORE_DB)}`);
    check(3, "database is gone after the simulated disaster", !(await databaseExists(conn, RESTORE_DB)));
    report.recoveryMs = await restore(conn, RESTORE_DB, backup.file);
    const recovered = await fingerprint(conn, RESTORE_DB);
    const diff3 = tableDifferences(before, recovered);
    check(3, "recovered database matches the original exactly", diff3.length === 0, diff3.join(", "));
    check(3, "recovery time", true, `${report.recoveryMs} ms`);

    // ---------------------------------------------------------------- 4
    console.log(`\n4. Point-in-time recovery in "${PITR_DB}"`);
    await restore(conn, PITR_DB, backup.file);
    // A backup of the drill database itself, so the binlog coordinates in it
    // refer to this database's state.
    const pitrBackupFile = path.join(BACKUP_DIR, `${PITR_DB}_baseline_${timestamp()}.sql`);
    tempFiles.push(pitrBackupFile);
    const pitrBackup = await backupDatabase(PITR_DB, pitrBackupFile);
    const baseline = await fingerprint(conn, PITR_DB);

    // Work that happens after the backup and must survive recovery.
    const [[account]] = await conn.query(`SELECT account_id FROM ${q(PITR_DB)}.Accounts ORDER BY account_id LIMIT 1`);
    const [[owner]] = await conn.query(`SELECT user_id FROM ${q(PITR_DB)}.Accounts WHERE account_id = ?`, [account.account_id]);
    const goodRows = [
      ["2026-10-02", "PITR DRILL GROCERY", -640],
      ["2026-10-03", "PITR DRILL FUEL", -1200],
      ["2026-10-04", "PITR DRILL REFUND", 300]
    ];
    for (const [date, description, amount] of goodRows) {
      await conn.query(
        `INSERT INTO ${q(PITR_DB)}.Transactions (account_id, transaction_date, description, raw_description, amount) VALUES (?, ?, ?, ?, ?)`,
        [account.account_id, date, description, description, amount]
      );
    }
    await conn.query(
      `INSERT INTO ${q(PITR_DB)}.Goals (user_id, name, target_amount, current_amount) VALUES (?, 'PITR drill goal', 5000, 500)`,
      [owner.user_id]
    );
    const goodState = await fingerprint(conn, PITR_DB);
    const goodPoint = await binlogStatus(conn);

    // The accident.
    const [deleted] = await conn.query(`DELETE FROM ${q(PITR_DB)}.Transactions`);
    const accidentEnd = await binlogStatus(conn);
    const [[{ remaining }]] = await conn.query(`SELECT COUNT(*) AS remaining FROM ${q(PITR_DB)}.Transactions`);
    check(4, "accidental DELETE wiped the transactions", remaining === 0, `${deleted.affectedRows} rows deleted`);

    // Recovery: restore the backup, then replay the binary log from the
    // backup's position up to the last good position (just before the DELETE).
    const started = Date.now();
    await restore(conn, PITR_DB, pitrBackup.file);
    const [logs] = await conn.query("SHOW BINARY LOGS");
    const names = logs.map((l) => l.Log_name);
    const files = names.slice(names.indexOf(pitrBackup.binlog.file), names.indexOf(goodPoint.file) + 1);
    await pipeTools(
      "mysqlbinlog",
      [
        "--read-from-remote-server",
        `--database=${PITR_DB}`,
        `--start-position=${pitrBackup.binlog.position}`,
        `--stop-position=${goodPoint.position}`,
        ...files
      ],
      "mysql",
      ["--default-character-set=utf8mb4"]
    );
    const pitrMs = Date.now() - started;
    const pitrRecovered = await fingerprint(conn, PITR_DB);

    const [[{ drillRows }]] = await conn.query(
      `SELECT COUNT(*) AS drillRows FROM ${q(PITR_DB)}.Transactions WHERE description LIKE 'PITR DRILL %'`
    );
    const [[{ drillGoals }]] = await conn.query(`SELECT COUNT(*) AS drillGoals FROM ${q(PITR_DB)}.Goals WHERE name = 'PITR drill goal'`);
    const diff4 = tableDifferences(goodState, pitrRecovered);
    check(4, "transactions are back", pitrRecovered.tables.transactions.rows === goodState.tables.transactions.rows, `${pitrRecovered.tables.transactions.rows} rows`);
    check(4, "changes made after the backup survived", drillRows === goodRows.length && drillGoals === 1, `${drillRows} drill transactions, ${drillGoals} drill goal`);
    check(4, "database matches its state just before the accident, table for table", diff4.length === 0, diff4.join(", "));
    check(4, "the backup alone would have lost those changes", tableDifferences(baseline, goodState).length > 0);

    report.pitr = {
      backupPosition: pitrBackup.binlog,
      goodPoint,
      accidentEnd,
      deleted: deleted.affectedRows,
      goodRows,
      replayedFiles: files,
      recoveryMs: pitrMs,
      baselineTxns: baseline.tables.transactions.rows,
      goodTxns: goodState.tables.transactions.rows
    };
  } finally {
    if (process.env.KEEP_DRILL_DBS !== "1") {
      await conn.query(`DROP DATABASE IF EXISTS ${q(RESTORE_DB)}`);
      await conn.query(`DROP DATABASE IF EXISTS ${q(PITR_DB)}`);
    }
    for (const file of tempFiles) {
      fs.rmSync(file, { force: true });
    }
    await conn.end();
  }

  report.finishedAt = new Date();
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, renderReport(report));
  const failed = checks.filter((c) => !c.passed);
  console.log(`\n${checks.length - failed.length}/${checks.length} checks passed. Report: ${path.relative(process.cwd(), REPORT_PATH)}`);
  if (failed.length) process.exitCode = 1;
}

function renderReport(r) {
  const fmt = (n) => Number(n).toLocaleString("en-IN");
  const when = r.startedAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  const allPassed = checks.every((c) => c.passed);
  const backupName = path.basename(r.backup.file);
  const p = r.pitr;

  const lines = [
    "# Backup & Recovery Drill (Task 30)",
    "",
    `Drill run on **${when}** against MySQL ${r.server.version} by \`npm run drill:backup\``,
    "(backend/scripts/backup-drill.js). Re-run it to repeat the drill and refresh this report.",
    "",
    `**Result: ${allPassed ? "PASSED" : "FAILED"}: ${checks.filter((c) => c.passed).length} of ${checks.length} checks passed.**`,
    "",
    "Only the backup step touches the real database, and it only reads. Every destructive step ran on throwaway",
    `databases (\`${RESTORE_DB}\`, \`${PITR_DB}\`) that were dropped afterwards.`,
    "",
    "## Results",
    "",
    "| Step | Check | Result | Detail |",
    "|---|---|---|---|",
    ...checks.map((c) => `| ${c.step} | ${c.description} | ${c.passed ? "✅ Pass" : "❌ Fail"} | ${c.detail || ""} |`),
    "",
    "## 1. Full backup",
    "",
    `- File: \`backend/backups/${backupName}\` (${(r.backup.bytes / 1024).toFixed(1)} KB, taken in ${r.backup.durationMs} ms).`,
    `- Binary log position recorded in the backup: \`${r.backup.binlog.file}:${r.backup.binlog.position}\`.`,
    `- Contents: ${Object.keys(r.source.tables).length} tables, ${r.source.routines.length} stored routines (${r.source.routines.join(", ")}),`,
    `  ${r.source.triggers.length} trigger (${r.source.triggers.join(", ")}), ${r.source.events.length} event (${r.source.events.join(", ")}).`,
    "",
    "## 2. Restore test",
    "",
    `Restored into \`${RESTORE_DB}\` in ${r.restoreMs} ms and compared table by table with the live database:`,
    "",
    "| Table | Rows (live) | Rows (restored) | CHECKSUM TABLE match |",
    "|---|---:|---:|---|",
    ...Object.entries(r.source.tables).map(([name, t]) => {
      const restoredTable = r.restored.tables[name] || { rows: "missing", checksum: "" };
      return `| ${name} | ${fmt(t.rows)} | ${fmt(restoredTable.rows)} | ${t.checksum === restoredTable.checksum ? "✅" : "❌"} |`;
    }),
    "",
    "## 3. Total loss and recovery",
    "",
    `The restored database was dropped entirely (simulating a lost server or a \`DROP DATABASE\`), then rebuilt from`,
    `the backup file. **Recovery took ${r.recoveryMs} ms** and the result matched the original exactly.`,
    "",
    "## 4. Point-in-time recovery",
    "",
    "A backup only protects data up to the moment it was taken. The binary log (on by default in MySQL 8,",
    `\`binlog_format=${r.server.format}\`, kept ${Math.round(r.server.expire / 86400)} days) records every change made after it, so a backup plus the`,
    "log can rebuild the database at *any* moment, for example just before an accident.",
    "",
    "| Time | What happened | Binary log position |",
    "|---|---|---|",
    `| T0 | Backup taken (${fmt(p.baselineTxns)} transactions) | \`${p.backupPosition.file}:${p.backupPosition.position}\` |`,
    `| T1 | Normal work: ${p.goodRows.length} new transactions and a new savings goal | |`,
    `| T2 | Last good moment (${fmt(p.goodTxns)} transactions) | \`${p.goodPoint.file}:${p.goodPoint.position}\` |`,
    `| T3 | **Accident:** \`DELETE FROM Transactions\` without a WHERE clause, ${fmt(p.deleted)} rows lost | ends at \`${p.accidentEnd.file}:${p.accidentEnd.position}\` |`,
    `| T4 | Recovery: restore the T0 backup, replay the log from T0 to T2 (${p.recoveryMs} ms) | |`,
    "",
    `After recovery the database matched its T2 state table for table: the ${p.goodRows.length} transactions and the goal added after the`,
    "backup are present, and the accidental delete is not. Restoring the backup alone would have lost the T1 work.",
    "",
    "## Recovery runbook",
    "",
    "Commands assume the MySQL `bin` folder is on PATH (on this PC: `C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin`) and are",
    "run from `backend/`. `-p` prompts for the MySQL password.",
    "",
    "### Take a backup",
    "",
    "```powershell",
    "npm run db:backup",
    "```",
    "",
    "which runs:",
    "",
    "```powershell",
    "mysqldump -u root -p --single-transaction --source-data=2 --routines --triggers --events --set-gtid-purged=OFF --no-tablespaces --default-character-set=utf8mb4 fintrack > backups\\fintrack_YYYYMMDD_HHMMSS.sql",
    "```",
    "",
    "- `--single-transaction` takes a consistent snapshot without locking the app out.",
    "- `--routines --triggers --events` are essential: without them the categorization function, the MonthlySummary",
    "  trigger and the hourly subscription check would be missing after a restore.",
    "- `--source-data=2` writes the binary log position into the file (as a comment) for point-in-time recovery.",
    "",
    "### Restore after losing the database",
    "",
    "1. Stop the backend (`Ctrl+C` in its terminal) so nothing writes during the restore.",
    "2. Recreate the database and load the newest backup:",
    "",
    "   ```powershell",
    "   mysql -u root -p -e \"DROP DATABASE IF EXISTS fintrack; CREATE DATABASE fintrack CHARACTER SET utf8mb4;\"",
    "   cmd /c \"mysql -u root -p --default-character-set=utf8mb4 fintrack < backups\\fintrack_YYYYMMDD_HHMMSS.sql\"",
    "   ```",
    "",
    "   (`cmd /c` because PowerShell has no `<` redirect.) Don't add a collation to `CREATE DATABASE`: the stored",
    "   routines take the database's collation, and it must match the tables' (MySQL default `utf8mb4_0900_ai_ci`).",
    "3. Start the backend and log in to check.",
    "",
    "### Undo an accident (point-in-time recovery)",
    "",
    "1. Find where the backup ends: the `SOURCE_LOG_FILE` / `SOURCE_LOG_POS` comment near the top of the backup file.",
    "2. Find the accident in the binary log. Decode it and search for the statement:",
    "",
    "   ```powershell",
    "   mysqlbinlog -u root -p --read-from-remote-server --verbose --base64-output=DECODE-ROWS --database=fintrack binlog.000001 > binlog.txt",
    "   ```",
    "",
    "   Each event is preceded by `# at <position>`. The accident's `# at` value is the stop position.",
    "3. Restore the backup as above, then replay everything between the two positions:",
    "",
    "   ```powershell",
    "   cmd /c \"mysqlbinlog -u root -p --read-from-remote-server --database=fintrack --start-position=<backup pos> --stop-position=<accident pos> binlog.000001 | mysql -u root -p\"",
    "   ```",
    "",
    "   If the log rotated in between, list every file from the backup's file to the accident's file; the start",
    "   position applies to the first and the stop position to the last.",
    "",
    "### Recommended schedule",
    "",
    "| What | How often | Keep |",
    "|---|---|---|",
    "| `npm run db:backup` (Windows Task Scheduler, or a cron job on a server) | Daily | 7 daily + 4 weekly |",
    `| Binary log (automatic) | Continuous | ${Math.round(r.server.expire / 86400)} days (\`binlog_expire_logs_seconds\`), comfortably longer than the gap between backups |`,
    "| Copy of the latest backup off this machine | Weekly | 4 |",
    "| This drill (`npm run drill:backup`) | Monthly, and after schema changes | Report in this file |",
    "",
    "Backups contain users' data and password hashes: `backups/` is in `.gitignore` and must never be committed or shared.",
    ""
  ];
  return lines.join("\n");
}

main().catch((err) => {
  console.error("\nDrill aborted:", err.message);
  process.exitCode = 1;
});
