# Backup & Recovery Drill (Task 30)

Drill run on **8 Oct 2026, 6:33 pm** against MySQL 8.4.9 by `npm run drill:backup`
(backend/scripts/backup-drill.js). Re-run it to repeat the drill and refresh this report.

**Result: PASSED: 16 of 16 checks passed.**

Only the backup step touches the real database, and it only reads. Every destructive step ran on throwaway
databases (`fintrack_restore_test`, `fintrack_pitr_test`) that were dropped afterwards.

## Results

| Step | Check | Result | Detail |
|---|---|---|---|
| 1 | mysqldump completed | ✅ Pass | 49.4 KB in 186 ms |
| 1 | backup records its binary log position | ✅ Pass | binlog.000001:54102745 |
| 1 | source database didn't change during the backup | ✅ Pass |  |
| 2 | all 15 tables match row-for-row (count + CHECKSUM TABLE) | ✅ Pass |  |
| 2 | stored function and procedures restored | ✅ Pass | FUNCTION fn_categorize_transaction, PROCEDURE sp_check_upcoming_subscriptions, PROCEDURE sp_generate_monthly_summary |
| 2 | trigger restored | ✅ Pass | trg_after_transaction_insert |
| 2 | scheduled event restored | ✅ Pass | evt_check_upcoming_subscriptions |
| 2 | restored categorization function gives the same answer | ✅ Pass | "SWIGGY ORDER 48213" -> category 3 |
| 3 | database is gone after the simulated disaster | ✅ Pass |  |
| 3 | recovered database matches the original exactly | ✅ Pass |  |
| 3 | recovery time | ✅ Pass | 829 ms |
| 4 | accidental DELETE wiped the transactions | ✅ Pass | 41 rows deleted |
| 4 | transactions are back | ✅ Pass | 41 rows |
| 4 | changes made after the backup survived | ✅ Pass | 3 drill transactions, 1 drill goal |
| 4 | database matches its state just before the accident, table for table | ✅ Pass |  |
| 4 | the backup alone would have lost those changes | ✅ Pass |  |

## 1. Full backup

- File: `backend/backups/fintrack_20261008_183347.sql` (49.4 KB, taken in 186 ms).
- Binary log position recorded in the backup: `binlog.000001:54102745`.
- Contents: 15 tables, 3 stored routines (FUNCTION fn_categorize_transaction, PROCEDURE sp_check_upcoming_subscriptions, PROCEDURE sp_generate_monthly_summary),
  1 trigger (trg_after_transaction_insert), 1 event (evt_check_upcoming_subscriptions).

## 2. Restore test

Restored into `fintrack_restore_test` in 819 ms and compared table by table with the live database:

| Table | Rows (live) | Rows (restored) | CHECKSUM TABLE match |
|---|---:|---:|---|
| accounts | 1 | 1 | ✅ |
| auditlog | 18 | 18 | ✅ |
| budgets | 5 | 5 | ✅ |
| categories | 17 | 17 | ✅ |
| categoryrules | 22 | 22 | ✅ |
| currencies | 2 | 2 | ✅ |
| goals | 2 | 2 | ✅ |
| merchants | 36 | 36 | ✅ |
| monthlysummary | 22 | 22 | ✅ |
| notifications | 1 | 1 | ✅ |
| subscriptions | 5 | 5 | ✅ |
| transactions | 38 | 38 | ✅ |
| uploadedfiles | 9 | 9 | ✅ |
| users | 2 | 2 | ✅ |
| usersettings | 2 | 2 | ✅ |

## 3. Total loss and recovery

The restored database was dropped entirely (simulating a lost server or a `DROP DATABASE`), then rebuilt from
the backup file. **Recovery took 829 ms** and the result matched the original exactly.

## 4. Point-in-time recovery

A backup only protects data up to the moment it was taken. The binary log (on by default in MySQL 8,
`binlog_format=ROW`, kept 30 days) records every change made after it, so a backup plus the
log can rebuild the database at *any* moment, for example just before an accident.

| Time | What happened | Binary log position |
|---|---|---|
| T0 | Backup taken (38 transactions) | `binlog.000001:54260391` |
| T1 | Normal work: 3 new transactions and a new savings goal | |
| T2 | Last good moment (41 transactions) | `binlog.000001:54262756` |
| T3 | **Accident:** `DELETE FROM Transactions` without a WHERE clause, 41 rows lost | ends at `binlog.000001:54266723` |
| T4 | Recovery: restore the T0 backup, replay the log from T0 to T2 (1226 ms) | |

After recovery the database matched its T2 state table for table: the 3 transactions and the goal added after the
backup are present, and the accidental delete is not. Restoring the backup alone would have lost the T1 work.

## Recovery runbook

Commands assume the MySQL `bin` folder is on PATH (on this PC: `C:\Program Files\MySQL\MySQL Server 8.4\bin`) and are
run from `backend/`. `-p` prompts for the MySQL password.

### Take a backup

```powershell
npm run db:backup
```

which runs:

```powershell
mysqldump -u root -p --single-transaction --source-data=2 --routines --triggers --events --set-gtid-purged=OFF --no-tablespaces --default-character-set=utf8mb4 fintrack > backups\fintrack_YYYYMMDD_HHMMSS.sql
```

- `--single-transaction` takes a consistent snapshot without locking the app out.
- `--routines --triggers --events` are essential: without them the categorization function, the MonthlySummary
  trigger and the hourly subscription check would be missing after a restore.
- `--source-data=2` writes the binary log position into the file (as a comment) for point-in-time recovery.

### Restore after losing the database

1. Stop the backend (`Ctrl+C` in its terminal) so nothing writes during the restore.
2. Recreate the database and load the newest backup:

   ```powershell
   mysql -u root -p -e "DROP DATABASE IF EXISTS fintrack; CREATE DATABASE fintrack CHARACTER SET utf8mb4;"
   cmd /c "mysql -u root -p --default-character-set=utf8mb4 fintrack < backups\fintrack_YYYYMMDD_HHMMSS.sql"
   ```

   (`cmd /c` because PowerShell has no `<` redirect.) Don't add a collation to `CREATE DATABASE`: the stored
   routines take the database's collation, and it must match the tables' (MySQL default `utf8mb4_0900_ai_ci`).
3. Start the backend and log in to check.

### Undo an accident (point-in-time recovery)

1. Find where the backup ends: the `SOURCE_LOG_FILE` / `SOURCE_LOG_POS` comment near the top of the backup file.
2. Find the accident in the binary log. Decode it and search for the statement:

   ```powershell
   mysqlbinlog -u root -p --read-from-remote-server --verbose --base64-output=DECODE-ROWS --database=fintrack binlog.000001 > binlog.txt
   ```

   Each event is preceded by `# at <position>`. The accident's `# at` value is the stop position.
3. Restore the backup as above, then replay everything between the two positions:

   ```powershell
   cmd /c "mysqlbinlog -u root -p --read-from-remote-server --database=fintrack --start-position=<backup pos> --stop-position=<accident pos> binlog.000001 | mysql -u root -p"
   ```

   If the log rotated in between, list every file from the backup's file to the accident's file; the start
   position applies to the first and the stop position to the last.

### Recommended schedule

| What | How often | Keep |
|---|---|---|
| `npm run db:backup` (Windows Task Scheduler, or a cron job on a server) | Daily | 7 daily + 4 weekly |
| Binary log (automatic) | Continuous | 30 days (`binlog_expire_logs_seconds`), comfortably longer than the gap between backups |
| Copy of the latest backup off this machine | Weekly | 4 |
| This drill (`npm run drill:backup`) | Monthly, and after schema changes | Report in this file |

Backups contain users' data and password hashes: `backups/` is in `.gitignore` and must never be committed or shared.
