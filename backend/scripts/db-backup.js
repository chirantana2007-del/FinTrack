// Takes a full backup of the FinTrack database into backend/backups/.
//
//   npm run db:backup
//
// Restoring is deliberately not scripted (it overwrites data); see
// docs/backup-recovery.md for the restore commands.
const path = require("path");
const { backupDatabase } = require("./lib/backup");

const database = process.env.DB_NAME || "fintrack";

backupDatabase(database)
  .then(({ file, bytes, durationMs, binlog }) => {
    console.log(`Backed up "${database}" to ${path.relative(process.cwd(), file)}`);
    console.log(`  ${(bytes / 1024).toFixed(1)} KB in ${durationMs} ms`);
    if (binlog) {
      console.log(`  Binary log position at backup time: ${binlog.file}:${binlog.position}`);
    }
  })
  .catch((err) => {
    console.error("Backup failed:", err.message);
    process.exitCode = 1;
  });
