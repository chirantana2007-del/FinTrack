const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "test-secret";

jest.mock("../src/config/db", () => ({
  execute: jest.fn(),
  query: jest.fn()
}));

const pool = require("../src/config/db");
const adminRoutes = require("../src/routes/admin.routes");
const { errorHandler } = require("../src/middleware/errorHandler");

const app = express();
app.use(express.json());
app.use("/api/admin", adminRoutes);
app.use(errorHandler);

const adminToken = jwt.sign({ id: 1, email: "admin@example.com", role: "admin" }, process.env.JWT_SECRET);
const userToken = jwt.sign({ id: 2, email: "user@example.com", role: "user" }, process.env.JWT_SECRET);

const asAdmin = (req) => req.set("Authorization", `Bearer ${adminToken}`);

describe("Admin access control", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test.each(["/dashboard", "/users", "/uploads", "/audit-log"])(
    "%s rejects unauthenticated requests",
    async (path) => {
      const response = await request(app).get(`/api/admin${path}`);
      expect(response.status).toBe(401);
      expect(response.body.message).toBe("Authentication required");
    }
  );

  test.each(["/dashboard", "/users", "/uploads", "/audit-log"])(
    "%s rejects non-admin users without touching the database",
    async (path) => {
      const response = await request(app)
        .get(`/api/admin${path}`)
        .set("Authorization", `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.message).toBe("Admin access required");
      expect(pool.execute).not.toHaveBeenCalled();
    }
  );
});

describe("Admin dashboard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns platform totals and uploads by status", async () => {
    pool.execute
      .mockResolvedValueOnce([[{ totalUsers: 2, failedUploads: 1 }]])
      .mockResolvedValueOnce([[{ status: "completed", count: 3 }, { status: "failed", count: 1 }]]);

    const response = await asAdmin(request(app).get("/api/admin/dashboard"));

    expect(response.status).toBe(200);
    expect(response.body.totals.totalUsers).toBe(2);
    expect(response.body.uploadsByStatus).toHaveLength(2);
  });
});

describe("Admin users", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("lists users without ever selecting password hashes", async () => {
    pool.execute
      .mockResolvedValueOnce([[{ user_id: 1, email: "demo@fintrack.dev" }]])
      .mockResolvedValueOnce([[{ total: 1 }]]);

    const response = await asAdmin(request(app).get("/api/admin/users"));

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(pool.execute.mock.calls[0][0]).not.toMatch(/password_hash|u\.\*/);
  });

  test("applies search and role filters as bound parameters", async () => {
    pool.execute
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ total: 0 }]]);

    await asAdmin(request(app).get("/api/admin/users?search=demo&role=admin"));

    const [sql, params] = pool.execute.mock.calls[0];
    expect(sql).toContain("u.full_name LIKE ? OR u.email LIKE ?");
    expect(sql).toContain("u.role = ?");
    expect(params).toEqual(["%demo%", "%demo%", "admin"]);
  });

  test("ignores an unknown role and clamps pagination", async () => {
    pool.execute
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ total: 0 }]]);

    const response = await asAdmin(request(app).get("/api/admin/users?role=superuser&limit=9999&offset=-5"));

    const [sql, params] = pool.execute.mock.calls[0];
    expect(sql).not.toContain("u.role = ?");
    expect(sql).toContain("LIMIT 200 OFFSET 0");
    expect(params).toEqual([]);
    expect(response.body.limit).toBe(200);
  });
});

describe("Admin uploads", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("filters by status and user", async () => {
    pool.execute
      .mockResolvedValueOnce([[{ file_id: 3, status: "failed" }]])
      .mockResolvedValueOnce([[{ total: 1 }]]);

    const response = await asAdmin(request(app).get("/api/admin/uploads?status=failed&user_id=2"));

    expect(response.status).toBe(200);
    expect(response.body.uploads[0].status).toBe("failed");
    expect(pool.execute.mock.calls[0][1]).toEqual(["failed", 2]);
    expect(pool.execute.mock.calls[1][1]).toEqual(["failed", 2]);
  });

  test("ignores an invalid status filter", async () => {
    pool.execute
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ total: 0 }]]);

    await asAdmin(request(app).get("/api/admin/uploads?status=deleted"));

    expect(pool.execute.mock.calls[0][0]).not.toContain("f.status = ?");
  });
});

describe("Admin audit log", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("matches an action prefix like 'auth'", async () => {
    pool.execute
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ total: 0 }]]);

    await asAdmin(request(app).get("/api/admin/audit-log?action=auth"));

    const [sql, params] = pool.execute.mock.calls[0];
    expect(sql).toContain("l.action LIKE ?");
    expect(params).toEqual(["auth.%"]);
  });

  test("matches a full action name exactly", async () => {
    pool.execute
      .mockResolvedValueOnce([[{ audit_id: 1, action: "auth.login_failed" }]])
      .mockResolvedValueOnce([[{ total: 1 }]]);

    const response = await asAdmin(request(app).get("/api/admin/audit-log?action=auth.login_failed"));

    const [sql, params] = pool.execute.mock.calls[0];
    expect(sql).toContain("l.action = ?");
    expect(params).toEqual(["auth.login_failed"]);
    expect(response.body.entries).toHaveLength(1);
  });
});
