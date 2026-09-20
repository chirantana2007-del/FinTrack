const express = require("express");
const request = require("supertest");

jest.mock("../src/config/db", () => ({
  execute: jest.fn()
}));

const pool = require("../src/config/db");
const authRoutes = require("../src/routes/auth.routes");

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);

process.env.JWT_SECRET = "test-secret";

describe("Authentication", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("register should reject missing fields", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({
        email: "test@example.com"
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Name, email and password are required"
    );
  });

  test("login should reject missing fields", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "test@example.com"
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Email and password are required"
    );
  });

  test("login should reject unknown user", async () => {
    pool.execute.mockResolvedValue([[]]);

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "unknown@example.com",
        password: "password123"
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe(
      "Invalid email or password"
    );
  });
});