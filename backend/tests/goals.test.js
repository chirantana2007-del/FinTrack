const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "test-secret";

jest.mock("../src/config/db", () => ({
  query: jest.fn(),
  execute: jest.fn()
}));

const pool = require("../src/config/db");
const goalsRoutes = require("../src/routes/goals.routes");
const { errorHandler } = require("../src/middleware/errorHandler");

const app = express();
app.use(express.json());
app.use("/api/goals", goalsRoutes);
app.use(errorHandler);

const token = jwt.sign({ id: 1, email: "demo@fintrack.dev", role: "user" }, process.env.JWT_SECRET);
const auth = (req) => req.set("Authorization", `Bearer ${token}`);

const goalRow = (overrides = {}) => ({
  id: 5,
  name: "Emergency fund",
  target_amount: 100000,
  current_amount: 25000,
  target_date: "2027-03-31",
  status: "active",
  progress_pct: 25,
  ...overrides
});

// Dispatch pool.query by a fragment of the SQL so tests don't depend on call order.
function sqlMock(rules) {
  return jest.fn((sql, params) => {
    const rule = rules.find(([fragment]) => sql.includes(fragment));
    if (!rule) throw new Error(`Unexpected SQL in test: ${sql}`);
    return Promise.resolve(rule[1](params));
  });
}

describe("Goals API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("rejects unauthenticated requests", async () => {
    const response = await request(app).get("/api/goals");
    expect(response.status).toBe(401);
  });

  test("lists only the current user's goals", async () => {
    pool.query = sqlMock([["FROM Goals", () => [[goalRow()]]]]);

    const response = await auth(request(app).get("/api/goals"));

    expect(response.status).toBe(200);
    expect(response.body.data[0].id).toBe(5);
    expect(pool.query.mock.calls[0][1]).toEqual([1]);
  });

  test("returns 404 for a goal that isn't the user's", async () => {
    pool.query = sqlMock([["FROM Goals WHERE goal_id = ? AND user_id = ?", () => [[]]]]);

    const response = await auth(request(app).get("/api/goals/99"));

    expect(response.status).toBe(404);
    expect(pool.query.mock.calls[0][1]).toEqual(["99", 1]);
  });
});

describe("Create goal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("creates an active goal with defaults", async () => {
    pool.query = sqlMock([
      ["INSERT INTO Goals", () => [{ insertId: 5 }]],
      ["FROM Goals WHERE goal_id", () => [[goalRow({ current_amount: 0 })]]]
    ]);

    const response = await auth(request(app).post("/api/goals"))
      .send({ name: "  Emergency fund  ", target_amount: "100000", target_date: "2099-12-31" });

    expect(response.status).toBe(201);
    expect(response.body.data.id).toBe(5);
    const insert = pool.query.mock.calls.find(([sql]) => sql.includes("INSERT INTO Goals"));
    expect(insert[1]).toEqual([1, "Emergency fund", 100000, 0, "2099-12-31", "active"]);
  });

  test("marks a goal created already funded as completed", async () => {
    pool.query = sqlMock([
      ["INSERT INTO Goals", () => [{ insertId: 6 }]],
      ["FROM Goals WHERE goal_id", () => [[goalRow({ status: "completed" })]]]
    ]);

    await auth(request(app).post("/api/goals")).send({ name: "Laptop", target_amount: 50000, current_amount: 50000 });

    const insert = pool.query.mock.calls.find(([sql]) => sql.includes("INSERT INTO Goals"));
    expect(insert[1][5]).toBe("completed");
  });

  test.each([
    [{ target_amount: 1000 }, "name is required"],
    [{ name: "   ", target_amount: 1000 }, "name is required"],
    [{ name: "x".repeat(151), target_amount: 1000 }, "name must be at most 150 characters"],
    [{ name: "Trip" }, "target_amount must be a number greater than 0"],
    [{ name: "Trip", target_amount: 0 }, "target_amount must be a number greater than 0"],
    [{ name: "Trip", target_amount: "abc" }, "target_amount must be a number greater than 0"],
    [{ name: "Trip", target_amount: 1000, current_amount: -1 }, "current_amount must be a number of 0 or more"],
    [{ name: "Trip", target_amount: 1000, target_date: "2027-02-30" }, "target_date must be a valid date in YYYY-MM-DD format"],
    [{ name: "Trip", target_amount: 1000, target_date: "2000-01-01" }, "target_date cannot be in the past"],
    [{ name: "Trip", target_amount: 1000, status: "paused" }, "status must be one of: active, completed, abandoned"]
  ])("rejects invalid input %j", async (body, message) => {
    pool.query = jest.fn();

    const response = await auth(request(app).post("/api/goals")).send(body);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(message);
    expect(pool.query).not.toHaveBeenCalled();
  });
});

describe("Update goal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("updates only the provided fields", async () => {
    pool.query = sqlMock([
      ["FROM Goals WHERE goal_id", () => [[goalRow()]]],
      ["UPDATE Goals SET", () => [{ affectedRows: 1 }]]
    ]);

    const response = await auth(request(app).put("/api/goals/5")).send({ name: "Rainy day fund", target_date: null });

    expect(response.status).toBe(200);
    const [sql, params] = pool.query.mock.calls.find(([s]) => s.includes("UPDATE Goals SET"));
    expect(sql).toContain("name = ?, target_date = ?");
    expect(sql).not.toContain("status");
    expect(params).toEqual(["Rainy day fund", null, "5", 1]);
  });

  test("auto-completes an active goal whose saved amount reaches the target", async () => {
    pool.query = sqlMock([
      ["FROM Goals WHERE goal_id", () => [[goalRow()]]],
      ["UPDATE Goals SET", () => [{ affectedRows: 1 }]]
    ]);

    await auth(request(app).put("/api/goals/5")).send({ current_amount: 100000 });

    const [sql, params] = pool.query.mock.calls.find(([s]) => s.includes("UPDATE Goals SET"));
    expect(sql).toContain("current_amount = ?, status = ?");
    expect(params).toEqual([100000, "completed", "5", 1]);
  });

  test("respects an explicit status even when the target is reached", async () => {
    pool.query = sqlMock([
      ["FROM Goals WHERE goal_id", () => [[goalRow()]]],
      ["UPDATE Goals SET", () => [{ affectedRows: 1 }]]
    ]);

    await auth(request(app).put("/api/goals/5")).send({ current_amount: 100000, status: "abandoned" });

    const [, params] = pool.query.mock.calls.find(([s]) => s.includes("UPDATE Goals SET"));
    expect(params).toEqual([100000, "abandoned", "5", 1]);
  });

  test("rejects an empty update", async () => {
    pool.query = jest.fn();

    const response = await auth(request(app).put("/api/goals/5")).send({});

    expect(response.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test("ignores unknown fields rather than writing them", async () => {
    pool.query = jest.fn();

    const response = await auth(request(app).put("/api/goals/5")).send({ user_id: 2 });

    expect(response.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test("returns 404 when updating someone else's goal", async () => {
    pool.query = sqlMock([["FROM Goals WHERE goal_id", () => [[]]]]);

    const response = await auth(request(app).put("/api/goals/99")).send({ name: "Mine now" });

    expect(response.status).toBe(404);
    expect(pool.query.mock.calls.some(([sql]) => sql.includes("UPDATE Goals"))).toBe(false);
  });
});

describe("Delete goal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("deletes the user's goal", async () => {
    pool.query = sqlMock([["DELETE FROM Goals", () => [{ affectedRows: 1 }]]]);

    const response = await auth(request(app).delete("/api/goals/5"));

    expect(response.status).toBe(200);
    expect(pool.query.mock.calls[0][1]).toEqual(["5", 1]);
  });

  test("returns 404 when the goal doesn't exist for the user", async () => {
    pool.query = sqlMock([["DELETE FROM Goals", () => [{ affectedRows: 0 }]]]);

    const response = await auth(request(app).delete("/api/goals/99"));

    expect(response.status).toBe(404);
  });
});

describe("Contribute to goal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("adds a contribution and returns the updated goal", async () => {
    pool.query = sqlMock([
      ["SET current_amount = current_amount + ?", () => [{ affectedRows: 1 }]],
      ["FROM Goals WHERE goal_id", () => [[goalRow({ current_amount: 30000 })]]]
    ]);

    const response = await auth(request(app).post("/api/goals/5/contribute")).send({ amount: 5000 });

    expect(response.status).toBe(200);
    expect(response.body.data.current_amount).toBe(30000);
    const [sql, params] = pool.query.mock.calls[0];
    expect(sql).toContain("status <> 'abandoned'");
    expect(params).toEqual([5000, "5", 1]);
  });

  test.each([0, -10, "abc", undefined])("rejects amount %p", async (amount) => {
    pool.query = jest.fn();

    const response = await auth(request(app).post("/api/goals/5/contribute")).send({ amount });

    expect(response.status).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test("refuses contributions to an abandoned goal", async () => {
    pool.query = sqlMock([
      ["SET current_amount = current_amount + ?", () => [{ affectedRows: 0 }]],
      ["FROM Goals WHERE goal_id", () => [[goalRow({ status: "abandoned" })]]]
    ]);

    const response = await auth(request(app).post("/api/goals/5/contribute")).send({ amount: 100 });

    expect(response.status).toBe(409);
  });

  test("returns 404 for a missing goal", async () => {
    pool.query = sqlMock([
      ["SET current_amount = current_amount + ?", () => [{ affectedRows: 0 }]],
      ["FROM Goals WHERE goal_id", () => [[]]]
    ]);

    const response = await auth(request(app).post("/api/goals/99/contribute")).send({ amount: 100 });

    expect(response.status).toBe(404);
  });
});
