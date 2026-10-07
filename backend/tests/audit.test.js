jest.mock("../src/config/db", () => ({
  execute: jest.fn()
}));

const pool = require("../src/config/db");
const { logAudit } = require("../src/services/audit.service");

describe("Audit logging", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("writes an AuditLog row with JSON details", async () => {
    pool.execute.mockResolvedValueOnce([{ insertId: 1 }]);

    await logAudit({
      userId: 4,
      action: "upload.completed",
      entityType: "UploadedFile",
      entityId: 9,
      details: { inserted: 21 }
    });

    const [sql, params] = pool.execute.mock.calls[0];
    expect(sql).toContain("INSERT INTO AuditLog");
    expect(params).toEqual([4, "upload.completed", "UploadedFile", 9, '{"inserted":21}']);
  });

  test("defaults optional fields to NULL", async () => {
    pool.execute.mockResolvedValueOnce([{ insertId: 2 }]);

    await logAudit({ action: "auth.login_failed" });

    expect(pool.execute.mock.calls[0][1]).toEqual([null, "auth.login_failed", null, null, null]);
  });

  test("never throws when the write fails", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    pool.execute.mockRejectedValueOnce(new Error("table locked"));

    await expect(logAudit({ action: "auth.login" })).resolves.toBeUndefined();
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
