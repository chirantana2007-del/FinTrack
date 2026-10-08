const { createTestDatabase } = require("./helpers/testDb");

module.exports = async () => {
  await createTestDatabase();
};
