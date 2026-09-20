const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "test-secret";

jest.mock("../src/config/db", () => ({
  execute: jest.fn(),
  query: jest.fn(),
  getConnection: jest.fn()
}));

const pool = require("../src/config/db");
const uploadRoutes = require("../src/routes/upload.routes");
const { errorHandler } = require("../src/middleware/errorHandler");

const app = express();
app.use(express.json());
app.use("/api/upload", uploadRoutes);
app.use(errorHandler);

const token = jwt.sign({ id: 1, email: "demo@fintrack.dev", role: "user" }, process.env.JWT_SECRET);

// Dispatch pool.execute/query by matching on a fragment of the SQL text, so
// tests don't depend on the exact call order inside the controller/services.
function sqlMock(rules) {
  return jest.fn((sql, params) => {
    const rule = rules.find(([fragment]) => sql.includes(fragment));
    if (!rule) {
      throw new Error(`Unexpected SQL in test: ${sql}`);
    }
    return Promise.resolve(rule[1](params));
  });
}

describe("CSV Upload", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should reject request without auth", async () => {
    const response = await request(app).post("/api/upload/csv");
    expect(response.status).toBe(401);
  });

  test("should reject request without a CSV file", async () => {
    const response = await request(app)
      .post("/api/upload/csv")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("CSV file is required");
  });

  test("falls back to the user's default account when account_id is omitted", async () => {
    const connection = {
      beginTransaction: jest.fn().mockResolvedValue(),
      commit: jest.fn().mockResolvedValue(),
      rollback: jest.fn().mockResolvedValue(),
      release: jest.fn(),
      execute: sqlMock([
        ["FROM Merchants WHERE canonical_name", () => [[]]],
        ["INSERT INTO Merchants", () => [{ insertId: 10 }]],
        ["FROM CategoryRules", () => [[]]],
        ["INSERT INTO Transactions", () => [{ insertId: 1 }]]
      ]),
      query: sqlMock([
        ["SELECT merchant_id, canonical_name", () => [[]]],
        ["fn_categorize_transaction", () => [[{ category_id: null }]]]
      ])
    };

    pool.execute = sqlMock([
      ["FROM Accounts WHERE user_id = ? AND is_active", () => [[{ account_id: 3 }]]],
      ["INSERT INTO UploadedFiles", () => [{ insertId: 42 }]],
      ["UPDATE UploadedFiles", () => [{}]]
    ]);
    pool.getConnection.mockResolvedValue(connection);

    const response = await request(app)
      .post("/api/upload/csv")
      .set("Authorization", `Bearer ${token}`)
      .attach("file", Buffer.from("transaction_date,description,amount\n2026-01-01,TEST,500"), "test.csv");

    expect(response.status).toBe(200);
    expect(response.body.insertedCount).toBe(1);
  });

  test("should reject an account that doesn't belong to the user", async () => {
    pool.execute.mockResolvedValue([[]]);

    const response = await request(app)
      .post("/api/upload/csv")
      .set("Authorization", `Bearer ${token}`)
      .field("account_id", "5")
      .attach("file", Buffer.from("transaction_date,description,amount\n2026-01-01,TEST,500"), "test.csv");

    expect(response.status).toBe(404);
  });

  test("should parse, categorize, resolve merchants, and insert valid rows", async () => {
    const connection = {
      beginTransaction: jest.fn().mockResolvedValue(),
      commit: jest.fn().mockResolvedValue(),
      rollback: jest.fn().mockResolvedValue(),
      release: jest.fn(),
      execute: sqlMock([
        ["FROM Merchants WHERE canonical_name", () => [[]]],
        ["INSERT INTO Merchants", () => [{ insertId: 10 }]],
        ["FROM CategoryRules", () => [[]]],
        ["INSERT INTO Transactions", () => [{ insertId: 1 }]]
      ]),
      query: sqlMock([
        ["SELECT merchant_id, canonical_name", () => [[]]],
        ["fn_categorize_transaction", () => [[{ category_id: null }]]]
      ])
    };

    pool.execute = sqlMock([
      ["FROM Accounts", () => [[{ account_id: 5 }]]],
      ["INSERT INTO UploadedFiles", () => [{ insertId: 42 }]],
      ["UPDATE UploadedFiles", () => [{}]]
    ]);
    pool.getConnection.mockResolvedValue(connection);

    const csv = `transaction_date,description,amount
2026-01-01,TEST STORE,500
2026-01-02,COFFEE SHOP,150`;

    const response = await request(app)
      .post("/api/upload/csv")
      .set("Authorization", `Bearer ${token}`)
      .field("account_id", "5")
      .attach("file", Buffer.from(csv), "test.csv");

    expect(response.status).toBe(200);
    expect(response.body.insertedCount).toBe(2);
    expect(response.body.failedCount).toBe(0);
    expect(connection.commit).toHaveBeenCalled();
    expect(connection.rollback).not.toHaveBeenCalled();
  });

  test("should collect row-level errors without failing the whole batch", async () => {
    const connection = {
      beginTransaction: jest.fn().mockResolvedValue(),
      commit: jest.fn().mockResolvedValue(),
      rollback: jest.fn().mockResolvedValue(),
      release: jest.fn(),
      execute: sqlMock([
        ["FROM Merchants WHERE canonical_name", () => [[]]],
        ["INSERT INTO Merchants", () => [{ insertId: 10 }]],
        ["FROM CategoryRules", () => [[]]],
        ["INSERT INTO Transactions", () => [{ insertId: 1 }]]
      ]),
      query: sqlMock([
        ["SELECT merchant_id, canonical_name", () => [[]]],
        ["fn_categorize_transaction", () => [[{ category_id: null }]]]
      ])
    };

    pool.execute = sqlMock([
      ["FROM Accounts", () => [[{ account_id: 5 }]]],
      ["INSERT INTO UploadedFiles", () => [{ insertId: 42 }]],
      ["UPDATE UploadedFiles", () => [{}]]
    ]);
    pool.getConnection.mockResolvedValue(connection);

    const csv = `transaction_date,description,amount
2026-01-01,GOOD ROW,500
not-a-date,BAD ROW,abc`;

    const response = await request(app)
      .post("/api/upload/csv")
      .set("Authorization", `Bearer ${token}`)
      .field("account_id", "5")
      .attach("file", Buffer.from(csv), "test.csv");

    expect(response.status).toBe(200);
    expect(response.body.insertedCount).toBe(1);
    expect(response.body.failedCount).toBe(1);
    expect(response.body.errors[0].row).toBe(3);
  });

  test("should roll back to zero rows if the DB transaction fails partway", async () => {
    const connection = {
      beginTransaction: jest.fn().mockResolvedValue(),
      commit: jest.fn().mockResolvedValue(),
      rollback: jest.fn().mockResolvedValue(),
      release: jest.fn(),
      execute: jest.fn((sql) => {
        if (sql.includes("FROM Merchants WHERE canonical_name")) return Promise.resolve([[]]);
        if (sql.includes("INSERT INTO Merchants")) return Promise.resolve([{ insertId: 10 }]);
        if (sql.includes("FROM CategoryRules")) return Promise.resolve([[]]);
        if (sql.includes("INSERT INTO Transactions")) return Promise.reject(new Error("DB write failed"));
        throw new Error(`Unexpected SQL: ${sql}`);
      }),
      query: sqlMock([
        ["SELECT merchant_id, canonical_name", () => [[]]],
        ["fn_categorize_transaction", () => [[{ category_id: null }]]]
      ])
    };

    pool.execute = sqlMock([
      ["FROM Accounts", () => [[{ account_id: 5 }]]],
      ["INSERT INTO UploadedFiles", () => [{ insertId: 42 }]],
      ["UPDATE UploadedFiles", () => [{}]]
    ]);
    pool.getConnection.mockResolvedValue(connection);

    const response = await request(app)
      .post("/api/upload/csv")
      .set("Authorization", `Bearer ${token}`)
      .field("account_id", "5")
      .attach("file", Buffer.from("transaction_date,description,amount\n2026-01-01,TEST STORE,500"), "test.csv");

    expect(response.status).toBe(500);
    expect(connection.rollback).toHaveBeenCalled();
    expect(connection.commit).not.toHaveBeenCalled();
  });
});
