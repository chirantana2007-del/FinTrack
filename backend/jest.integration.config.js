// Integration tests: run against a real MySQL database (fintrack_test), which
// is rebuilt from src/db/*.sql before the run and dropped afterwards.
// Run with `npm run test:integration`. Needs MySQL running and backend/.env.
module.exports = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/integration/**/*.test.js"],
  globalSetup: "<rootDir>/tests/integration/globalSetup.js",
  globalTeardown: "<rootDir>/tests/integration/globalTeardown.js",
  setupFiles: ["<rootDir>/tests/integration/setupEnv.js"],
  testTimeout: 30000
};
