const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

const adminRoutes = require("../src/routes/admin.routes");

const app = express();

app.use(express.json());
app.use("/api/admin", adminRoutes);

process.env.JWT_SECRET = "test-secret";

describe("Admin Dashboard", () => {
  test("should reject requests without authentication", async () => {
    const response = await request(app)
      .get("/api/admin/dashboard");

    expect(response.status).toBe(401);
    expect(response.body.message).toBe(
      "Authentication required"
    );
  });

  test("should reject non-admin users", async () => {
    const token = jwt.sign(
      {
        id: 1,
        email: "user@example.com",
        role: "user"
      },
      process.env.JWT_SECRET
    );

    const response = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toBe(
      "Admin access required"
    );
  });

  test("should allow admin users", async () => {
    const token = jwt.sign(
      {
        id: 1,
        email: "admin@example.com",
        role: "admin"
      },
      process.env.JWT_SECRET
    );

    const response = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe(
      "Admin dashboard access granted"
    );
  });
});