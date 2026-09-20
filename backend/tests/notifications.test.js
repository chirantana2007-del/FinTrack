const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

const notificationRoutes = require("../src/routes/notifications.routes");

const app = express();

app.use(express.json());
app.use("/api/notifications", notificationRoutes);

process.env.JWT_SECRET = "test-secret";

const token = jwt.sign(
  {
    id: 1,
    email: "test@example.com",
    role: "user"
  },
  process.env.JWT_SECRET
);

describe("Notifications", () => {
  test("should reject unauthenticated requests", async () => {
    const response = await request(app)
      .post("/api/notifications/subscription")
      .send({
        merchant: "Netflix",
        amount: 649
      });

    expect(response.status).toBe(401);
  });

  test("should create a subscription notification", async () => {
    const response = await request(app)
      .post("/api/notifications/subscription")
      .set("Authorization", `Bearer ${token}`)
      .send({
        merchant: "Netflix",
        amount: 649
      });

    expect(response.status).toBe(201);
    expect(response.body.type).toBe("subscription");
    expect(response.body.data.merchant).toBe("Netflix");
    expect(response.body.data.amount).toBe(649);
  });

  test("should create a budget notification", async () => {
    const response = await request(app)
      .post("/api/notifications/budget")
      .set("Authorization", `Bearer ${token}`)
      .send({
        category: "Food",
        percentage: 80
      });

    expect(response.status).toBe(201);
    expect(response.body.type).toBe("budget");
    expect(response.body.data.category).toBe("Food");
    expect(response.body.data.percentage).toBe(80);
  });

  test("should create an anomaly notification", async () => {
    const response = await request(app)
      .post("/api/notifications/anomaly")
      .set("Authorization", `Bearer ${token}`)
      .send({
        description: "Unknown Store",
        amount: 5000
      });

    expect(response.status).toBe(201);
    expect(response.body.type).toBe("anomaly");
    expect(response.body.data.description).toBe("Unknown Store");
    expect(response.body.data.amount).toBe(5000);
  });
});