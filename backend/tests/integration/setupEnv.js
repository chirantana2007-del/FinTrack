// Runs in each test worker before any module loads, so src/config/db.js
// connects to the throwaway test database instead of the dev one. dotenv
// never overrides variables that are already set.
const { TEST_DB_NAME } = require("./helpers/testDb");

process.env.DB_NAME = TEST_DB_NAME;
process.env.JWT_SECRET = process.env.JWT_SECRET || "integration-test-secret";
