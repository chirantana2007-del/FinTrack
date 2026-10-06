const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "test-secret";

jest.mock("../src/config/db", () => ({
  execute: jest.fn(),
  query: jest.fn()
}));

const pool = require("../src/config/db");
const subscriptionRoutes = require("../src/routes/subscriptions.routes");
const { errorHandler } = require("../src/middleware/errorHandler");

const app = express();
app.use(express.json());
app.use("/api/subscriptions", subscriptionRoutes);
app.use(errorHandler);

const token = jwt.sign({ id: 1, email: "test@example.com", role: "user" }, process.env.JWT_SECRET);

describe("Subscriptions API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("rejects unauthenticated requests", async () => {
    const response = await request(app).get("/api/subscriptions");
    expect(response.status).toBe(401);
  });

  test("lists active subscriptions with a monthly total", async () => {
    pool.execute.mockResolvedValueOnce([[
      { subscription_id: 1, merchant_name: "NETFLIX", amount: 649, cadence: "monthly", is_active: 1 },
      { subscription_id: 2, merchant_name: "GYM", amount: 120, cadence: "weekly", is_active: 1 }
    ]]);

    const response = await request(app)
      .get("/api/subscriptions")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.subscriptions).toHaveLength(2);
    expect(response.body.monthlyTotal).toBe(1169); // 649 + 120 * 52 / 12
    expect(pool.execute.mock.calls[0][0]).toContain("AND s.is_active = 1");
  });

  test("includes inactive subscriptions when all=1", async () => {
    pool.execute.mockResolvedValueOnce([[]]);

    await request(app)
      .get("/api/subscriptions?all=1")
      .set("Authorization", `Bearer ${token}`);

    expect(pool.execute.mock.calls[0][0]).not.toContain("AND s.is_active = 1");
  });

  test("deactivates a subscription owned by the user", async () => {
    pool.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);

    const response = await request(app)
      .patch("/api/subscriptions/3")
      .set("Authorization", `Bearer ${token}`)
      .send({ is_active: false });

    expect(response.status).toBe(200);
    expect(pool.execute.mock.calls[0][1]).toEqual([0, "3", 1]);
  });

  test("rejects a non-boolean is_active", async () => {
    const response = await request(app)
      .patch("/api/subscriptions/3")
      .set("Authorization", `Bearer ${token}`)
      .send({ is_active: "no" });

    expect(response.status).toBe(400);
    expect(pool.execute).not.toHaveBeenCalled();
  });

  test("returns 404 for a subscription that isn't the user's", async () => {
    pool.execute.mockResolvedValueOnce([{ affectedRows: 0 }]);

    const response = await request(app)
      .patch("/api/subscriptions/999")
      .set("Authorization", `Bearer ${token}`)
      .send({ is_active: false });

    expect(response.status).toBe(404);
  });
});
