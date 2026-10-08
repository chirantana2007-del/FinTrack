const express = require("express");
const request = require("supertest");
const bcrypt = require("bcrypt");

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

  test("login records a failed attempt in the audit log", async () => {
    pool.execute.mockResolvedValue([[]]);

    await request(app)
      .post("/api/auth/login")
      .send({ email: "unknown@example.com", password: "password123" });

    const auditCall = pool.execute.mock.calls.find(([sql]) => sql.includes("INSERT INTO AuditLog"));
    expect(auditCall[1][1]).toBe("auth.login_failed");
    expect(JSON.parse(auditCall[1][4])).toEqual({ email: "unknown@example.com", reason: "unknown_email" });
  });

  test("login success issues a token and records an audit entry", async () => {
    const passwordHash = await bcrypt.hash("password123", 4);
    pool.execute
      .mockResolvedValueOnce([[{ user_id: 7, full_name: "Demo", email: "demo@fintrack.dev", role: "user", password_hash: passwordHash }]])
      .mockResolvedValueOnce([{ insertId: 1 }]);

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "demo@fintrack.dev", password: "password123" });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeTruthy();
    expect(response.body.user).toEqual({ id: 7, name: "Demo", email: "demo@fintrack.dev", role: "user" });
    expect(pool.execute.mock.calls[1][1].slice(0, 2)).toEqual([7, "auth.login"]);
  });
});