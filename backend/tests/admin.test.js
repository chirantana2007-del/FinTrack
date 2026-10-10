const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "test-secret";

jest.mock("../src/config/db", () => ({
  execute: jest.fn(),
  query: jest.fn()
}));

jest.mock("../src/services/audit.service", () => ({
  logAudit: jest.fn().mockResolvedValue()
}));

const pool = require("../src/config/db");
const { logAudit } = require("../src/services/audit.service");
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

describe("Admin database health", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test.each([
    ["get", "/database"],
    ["post", "/database/run-due-check"],
    ["post", "/database/rebuild-summary"]
  ])("%s %s is admin-only", async (method, path) => {
    const response = await request(app)[method](`/api/admin${path}`).set("Authorization", `Bearer ${userToken}`);
    expect(response.status).toBe(403);
    expect(pool.query).not.toHaveBeenCalled();
  });

  test("reports the scheduler, objects, next event run and per-month consistency", async () => {
    pool.query = jest.fn((sql) => {
      if (sql.includes("@@event_scheduler")) return Promise.resolve([[{ scheduler: "ON" }]]);
      if (sql.includes("information_schema.EVENTS")) {
        return Promise.resolve([[{
          name: "evt_check_upcoming_subscriptions", status: "ENABLED", interval_value: "1",
          interval_field: "HOUR", last_executed: "2026-10-10 23:22:08", definition: "CALL x"
        }]]);
      }
      if (sql.includes("information_schema.ROUTINES")) return Promise.resolve([[{ name: "sp_generate_monthly_summary", type: "PROCEDURE" }]]);
      if (sql.includes("information_schema.TRIGGERS")) return Promise.resolve([[{ name: "trg_after_transaction_insert" }]]);
      if (sql.includes("WITH txn AS")) {
        return Promise.resolve([[
          { month: "2026-10-01", userMonths: 1, txnIncome: "62350.00", txnExpense: "25493.00", summaryIncome: "62350.00", summaryExpense: "25493.00", mismatches: "0" },
          { month: "2026-09-01", userMonths: 2, txnIncome: "60850.00", txnExpense: "31440.00", summaryIncome: "1.00", summaryExpense: "31440.00", mismatches: "1" }
        ]]);
      }
      if (sql.includes("NOW()")) return Promise.resolve([[{ now: "2026-10-10 23:51:13" }]]);
      throw new Error(`Unexpected SQL: ${sql}`);
    });

    const response = await asAdmin(request(app).get("/api/admin/database"));

    expect(response.status).toBe(200);
    expect(response.body.scheduler).toBe("ON");
    expect(response.body.events[0].next_run).toBe("2026-10-11 00:22:08");
    expect(response.body.routines).toHaveLength(1);
    expect(response.body.triggers).toHaveLength(1);
    expect(response.body.consistency[0]).toMatchObject({ month: "2026-10-01", mismatches: 0, txnIncome: 62350 });
    expect(response.body.consistency[1].mismatches).toBe(1);
  });

  test("run-due-check calls the procedure for all users and reports what it created", async () => {
    const counts = [[[{ n: 4 }]], [[{ n: 6 }]]];
    pool.query = jest.fn((sql) => {
      if (sql.includes("COUNT(*)")) return Promise.resolve(counts.shift());
      if (sql === "CALL sp_check_upcoming_subscriptions(NULL)") return Promise.resolve([[]]);
      throw new Error(`Unexpected SQL: ${sql}`);
    });

    const response = await asAdmin(request(app).post("/api/admin/database/run-due-check"));

    expect(response.status).toBe(200);
    expect(response.body.created).toBe(2);
    expect(logAudit).toHaveBeenCalledWith(expect.objectContaining({ userId: 1, action: "admin.run_due_check" }));
  });

  test("rebuild-summary rejects a missing or malformed month", async () => {
    pool.query = jest.fn();
    for (const month of [undefined, "2026-13", "September"]) {
      const response = await asAdmin(request(app).post("/api/admin/database/rebuild-summary")).send({ month });
      expect(response.status).toBe(400);
    }
    expect(pool.execute).not.toHaveBeenCalled();
  });

  test("rebuild-summary reruns the procedure for each user in the month", async () => {
    const totals = [
      [[{ rows_: 9, income: "1.00", expense: "999999.00" }]],
      [[{ rows_: 12, income: "60850.00", expense: "31440.00" }]]
    ];
    pool.execute = jest.fn((sql) => {
      if (sql.includes("SELECT DISTINCT a.user_id")) return Promise.resolve([[{ user_id: 2 }, { user_id: 5 }]]);
      if (sql.includes("FROM MonthlySummary WHERE period_month = ?")) return Promise.resolve(totals.shift());
      throw new Error(`Unexpected SQL: ${sql}`);
    });
    pool.query = jest.fn().mockResolvedValue([[]]);

    const response = await asAdmin(request(app).post("/api/admin/database/rebuild-summary")).send({ month: "2026-09" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      month: "2026-09-01",
      users: 2,
      before: { rows: 9, income: 1, expense: 999999 },
      after: { rows: 12, income: 60850, expense: 31440 }
    });
    expect(pool.query.mock.calls).toEqual([
      ["CALL sp_generate_monthly_summary(?, ?)", [2, "2026-09-01"]],
      ["CALL sp_generate_monthly_summary(?, ?)", [5, "2026-09-01"]]
    ]);
    expect(logAudit).toHaveBeenCalledWith(expect.objectContaining({ action: "admin.rebuild_summary" }));
  });
});
