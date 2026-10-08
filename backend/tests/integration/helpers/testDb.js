const path = require("path");
const mysql = require("mysql2/promise");
const { runSqlFile } = require("../../../scripts/lib/sqlLoader");

require("dotenv").config({ path: path.join(__dirname, "../../../.env") });

const TEST_DB_NAME = process.env.TEST_DB_NAME || "fintrack_test";
const DB_DIR = path.join(__dirname, "../../../src/db");
// Same order as a fresh install (see each file's header comment).
const SQL_FILES = ["schema.sql", "procedures.sql", "triggers.sql", "seed.sql"];

// The suite drops and recreates this database, so refuse anything that
// doesn't look like a throwaway test database (e.g. the real `fintrack`).
function assertSafeName(name) {
  if (!/^[A-Za-z0-9_]+_test$/.test(name)) {
    throw new Error(`Refusing to use database "${name}" for integration tests: the name must end in "_test".`);
  }
}

function serverConnection() {
  return mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    dateStrings: true
  });
}

async function createTestDatabase() {
  assertSafeName(TEST_DB_NAME);
  const connection = await serverConnection();
  try {
    await connection.query(`DROP DATABASE IF EXISTS \`${TEST_DB_NAME}\``);
    // No explicit collation: the tables use the server default
    // (utf8mb4_0900_ai_ci), and routines inherit the database's, so the two
    // must match or LIKE comparisons in fn_categorize_transaction fail.
    await connection.query(`CREATE DATABASE \`${TEST_DB_NAME}\` CHARACTER SET utf8mb4`);
    await connection.query(`USE \`${TEST_DB_NAME}\``);
    for (const file of SQL_FILES) {
      await runSqlFile(connection, path.join(DB_DIR, file));
    }
  } finally {
    await connection.end();
  }
}

async function dropTestDatabase() {
  assertSafeName(TEST_DB_NAME);
  const connection = await serverConnection();
  try {
    await connection.query(`DROP DATABASE IF EXISTS \`${TEST_DB_NAME}\``);
  } finally {
    await connection.end();
  }
}

module.exports = { TEST_DB_NAME, createTestDatabase, dropTestDatabase };
