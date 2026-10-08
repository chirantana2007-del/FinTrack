const fs = require("fs");
const path = require("path");
const { runToFile } = require("./mysqlTools");

const BACKUP_DIR = path.join(__dirname, "../../backups");

// A consistent logical backup of one database: schema, data, stored
// routines, triggers and events.
//   --single-transaction  InnoDB snapshot, so the app can keep running
//   --source-data=2       records the binary log position the snapshot
//                         corresponds to (as a comment), for point-in-time
//                         recovery
//   no --databases        no CREATE DATABASE / USE in the file, so it can be
//                         restored into any database name
const DUMP_ARGS = [
  "--single-transaction",
  "--source-data=2",
  "--routines",
  "--triggers",
  "--events",
  "--set-gtid-purged=OFF",
  "--no-tablespaces",
  "--default-character-set=utf8mb4"
];

function timestamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

// Reads the binary log coordinates mysqldump wrote near the top of the file.
function readBinlogPosition(dumpFile) {
  const fd = fs.openSync(dumpFile, "r");
  const buffer = Buffer.alloc(8192);
  const bytes = fs.readSync(fd, buffer, 0, buffer.length, 0);
  fs.closeSync(fd);
  const head = buffer.toString("utf8", 0, bytes);
  const match = /(?:SOURCE|MASTER)_LOG_FILE='([^']+)',\s*(?:SOURCE|MASTER)_LOG_POS=(\d+)/.exec(head);
  return match ? { file: match[1], position: Number(match[2]) } : null;
}

async function backupDatabase(database, outputFile) {
  const file = outputFile || path.join(BACKUP_DIR, `${database}_${timestamp()}.sql`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const started = Date.now();
  await runToFile("mysqldump", [...DUMP_ARGS, database], file);
  return {
    file,
    bytes: fs.statSync(file).size,
    durationMs: Date.now() - started,
    binlog: readBinlogPosition(file)
  };
}

module.exports = { BACKUP_DIR, backupDatabase, timestamp };
