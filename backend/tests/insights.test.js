const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "test-secret";

jest.mock("../src/config/db", () => ({
  query: jest.fn(),
  execute: jest.fn()
}));

const pool = require("../src/config/db");
const insightsRoutes = require("../src/routes/insights.routes");
const { errorHandler } = require("../src/middleware/errorHandler");

const app = express();
app.use(express.json());
app.use("/api/insights", insightsRoutes);
app.use(errorHandler);

const tokenFor = (id) => jwt.sign({ id, email: `u${id}@example.com`, role: "user" }, process.env.JWT_SECRET);
const as = (id, req) => req.set("Authorization", `Bearer ${tokenFor(id)}`);

const debit = (id, spent) => ({
  transaction_id: id,
  category_id: 3,
  category_name: "Restaurants",
  merchant_name: "SWIGGY ORDER",
  description: "SWIGGY ORDER",
  transaction_date: `2026-08-${String(id).padStart(2, "0")}`,
  spent
});
const ordinary = [450, 470, 430, 500, 460, 440, 480, 455, 465].map((v, i) => debit(i + 1, v));

describe("AI Insights access", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test.each([
    ["get", "/api/insights/prediction"],
    ["get", "/api/insights/anomalies"],
    ["post", "/api/insights/nl-query"]
  ])("%s %s rejects a request with no login, without touching the database", async (method, path) => {
    const response = await request(app)[method](path).send({ query: "how much did I spend" });

    expect(response.status).toBe(401);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test("rejects an invalid token", async () => {
    const response = await request(app).get("/api/insights/prediction").set("Authorization", "Bearer not-a-token");
    expect(response.status).toBe(401);
  });
});

describe("GET /prediction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("forecasts from the signed-in user's spending, as positive amounts", async () => {
    pool.query.mockResolvedValueOnce([[
      { category_name: "Fuel", month: "2026-07", spent: "1000.00" },
      { category_name: "Fuel", month: "2026-08", spent: "1200.00" },
      { category_name: "Fuel", month: "2026-09", spent: "1500.00" }
    ]]);

    const response = await as(7, request(app).get("/api/insights/prediction"));

    expect(response.status).toBe(200);
    expect(response.body.predictions.Fuel.value).toBeCloseTo(1233.33, 2);
    expect(response.body.predictions.Fuel.trend).toBe("+25.0%");
    expect(response.body.basis.months).toEqual(["2026-07", "2026-08", "2026-09"]);
    expect(pool.query.mock.calls[0][1]).toEqual([7]);
  });

  test("returns an empty forecast for a user with no spending", async () => {
    pool.query.mockResolvedValueOnce([[]]);

    const response = await as(7, request(app).get("/api/insights/prediction"));

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ success: true, predictions: {}, basis: null });
  });
});

describe("GET /anomalies", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("flags the outlier, scopes to the user, and saves the flag", async () => {
    pool.query
      .mockResolvedValueOnce([[...ordinary, debit(10, 4000)]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);

    const response = await as(7, request(app).get("/api/insights/anomalies"));

    expect(response.status).toBe(200);
    expect(response.body.totalFlagged).toBe(1);
    expect(response.body.flagsUpdated).toBe(1);
    expect(response.body.anomalies[0]).toMatchObject({ id: 10, amount: 4000, category: "Restaurants" });
    expect(response.body.anomalies[0].methods).toEqual(["z-score", "iqr"]);

    expect(pool.query.mock.calls[0][1]).toEqual([7]);
    const [updateSql, updateParams] = pool.query.mock.calls[1];
    expect(updateSql).toContain("SET t.is_flagged_anomaly = (t.transaction_id IN (?))");
    expect(updateParams).toEqual([[10], 7, [10]]);
  });

  test("clears stale flags when nothing is unusual any more", async () => {
    pool.query.mockResolvedValueOnce([ordinary]).mockResolvedValueOnce([{ affectedRows: 2 }]);

    const response = await as(7, request(app).get("/api/insights/anomalies"));

    expect(response.body.anomalies).toEqual([]);
    expect(response.body.totalFlagged).toBe(0);
    const [updateSql, updateParams] = pool.query.mock.calls[1];
    expect(updateSql).toContain("SET t.is_flagged_anomaly = 0");
    expect(updateParams).toEqual([7]);
  });

  test("shows at most the ten most recent flagged transactions but reports the full count", async () => {
    // Twelve extreme orders, among enough routine ones (49 in all) that the
    // extremes are a small minority and don't move the quartiles.
    const rows = [...ordinary];
    for (let i = 0; i < 12; i += 1) rows.push(debit(20 + i, 100000 + i * 1000));
    for (let i = 0; i < 40; i += 1) rows.push(debit(60 + i, 440 + (i % 9) * 5));
    pool.query.mockResolvedValueOnce([rows]).mockResolvedValueOnce([{ affectedRows: 0 }]);

    const response = await as(7, request(app).get("/api/insights/anomalies"));

    expect(response.body.anomalies.length).toBeLessThanOrEqual(10);
    expect(response.body.totalFlagged).toBeGreaterThan(response.body.anomalies.length);
  });
});

describe("POST /nl-query", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test.each([undefined, "", "   ", 42])("rejects the query %p", async (query) => {
    const response = await as(7, request(app).post("/api/insights/nl-query")).send({ query });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Query is required");
    expect(pool.query).not.toHaveBeenCalled();
  });

  test("answers about the signed-in user, with positive totals and the question's meaning", async () => {
    pool.query.mockResolvedValueOnce([[{ total: "74934.00", count: 43 }]]);

    const response = await as(7, request(app).post("/api/insights/nl-query")).send({ query: "how much did I spend on food" });

    expect(response.status).toBe(200);
    expect(response.body.result).toMatchObject({
      totalAmount: 74934,
      count: 43,
      interpretation: "Food & dining spending, all time",
      period: null
    });
    expect(pool.query.mock.calls[0][1][0]).toBe(7);
    // The SQL shown on the page has the values filled in.
    expect(response.body.result.sql_used).toContain("a.user_id = 7");
    expect(response.body.result.sql_used).not.toContain("?");
  });

  test("honours 'last month'", async () => {
    pool.query.mockResolvedValueOnce([[{ total: "1200.00", count: 4 }]]);

    const response = await as(7, request(app).post("/api/insights/nl-query")).send({ query: "how much on fuel last month" });

    expect(response.body.result.period).toMatch(/^[A-Z][a-z]+ \d{4}$/);
    expect(response.body.result.interpretation).toBe(`Fuel spending, ${response.body.result.period}`);
    const params = pool.query.mock.calls[0][1];
    expect(params.slice(-2)).toEqual([expect.stringMatching(/^\d{4}-\d{2}-01$/), expect.stringMatching(/^\d{4}-\d{2}-01$/)]);
  });

  test("a largest-expense question reports the transaction itself", async () => {
    pool.query.mockResolvedValueOnce([[{ total: "15000.00", count: 1, description: "RENT PAYMENT SEPTEMBER", transaction_date: "2026-09-10" }]]);

    const response = await as(7, request(app).post("/api/insights/nl-query")).send({ query: "what was my highest expense" });

    expect(response.body.result.totalAmount).toBe(15000);
    expect(response.body.result.interpretation).toBe("Largest single expense, all time: RENT PAYMENT SEPTEMBER on 2026-09-10");
  });

  test("returns zero for a user with no matching spending", async () => {
    pool.query.mockResolvedValueOnce([[{ total: "0", count: 0 }]]);

    const response = await as(7, request(app).post("/api/insights/nl-query")).send({ query: "food" });

    expect(response.body.result).toMatchObject({ totalAmount: 0, count: 0 });
  });
});
