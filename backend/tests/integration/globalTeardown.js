const { dropTestDatabase } = require("./helpers/testDb");

// Set KEEP_TEST_DB=1 to leave fintrack_test in place for inspection.
module.exports = async () => {
  if (process.env.KEEP_TEST_DB !== "1") {
    await dropTestDatabase();
  }
};
