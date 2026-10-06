const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "test-secret";

jest.mock("../src/config/db", () => ({
  execute: jest.fn(),
  query: jest.fn()
}));

const pool = require("../src/config/db");
const notificationRoutes = require("../src/routes/notifications.routes");
const { errorHandler } = require("../src/middleware/errorHandler");

const app = express();
app.use(express.json());
app.use("/api/notifications", notificationRoutes);
app.use(errorHandler);

const token = jwt.sign({ id: 1, email: "test@example.com", role: "user" }, process.env.JWT_SECRET);

const sampleNotification = {
  notification_id: 9,
  type: "subscription_due",
  message: "NETFLIX payment of INR 649.00 is due tomorrow.",
  related_entity_type: "Subscription",
  related_entity_id: 3,
  is_read: 0,
  created_at: "2026-10-07 10:00:00"
};

describe("Notifications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pool.query.mockResolvedValue([[]]);
  });

  test("rejects unauthenticated requests", async () => {
    const response = await request(app).get("/api/notifications");
    expect(response.status).toBe(401);
  });

  test("runs the due-soon check, then lists notifications with an unread count", async () => {
    pool.execute
      .mockResolvedValueOnce([[sampleNotification]])
      .mockResolvedValueOnce([[{ unreadCount: 1 }]]);

    const response = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(pool.query).toHaveBeenCalledWith("CALL sp_check_upcoming_subscriptions(?)", [1]);
    expect(response.body.unreadCount).toBe(1);
    expect(response.body.notifications[0].type).toBe("subscription_due");
    expect(pool.execute.mock.calls[0][1]).toEqual([1]);
  });

  test("still lists notifications if the due-soon check fails", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
    pool.query.mockRejectedValueOnce(new Error("PROCEDURE does not exist"));
    pool.execute
      .mockResolvedValueOnce([[sampleNotification]])
      .mockResolvedValueOnce([[{ unreadCount: 1 }]]);

    const response = await request(app)
      .get("/api/notifications")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.notifications).toHaveLength(1);
    consoleError.mockRestore();
  });

  test("filters to unread and clamps the limit", async () => {
    pool.execute
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ unreadCount: 0 }]]);

    await request(app)
      .get("/api/notifications?unread=1&limit=5000")
      .set("Authorization", `Bearer ${token}`);

    const listSql = pool.execute.mock.calls[0][0];
    expect(listSql).toContain("AND is_read = 0");
    expect(listSql).toContain("LIMIT 100");
  });

  test("marks one notification as read, scoped to the user", async () => {
    pool.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);

    const response = await request(app)
      .patch("/api/notifications/9/read")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(pool.execute.mock.calls[0][1]).toEqual(["9", 1]);
  });

  test("returns 404 when marking someone else's notification", async () => {
    pool.execute.mockResolvedValueOnce([{ affectedRows: 0 }]);

    const response = await request(app)
      .patch("/api/notifications/999/read")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  test("marks all notifications as read", async () => {
    pool.execute.mockResolvedValueOnce([{ affectedRows: 4 }]);

    const response = await request(app)
      .patch("/api/notifications/read-all")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.updated).toBe(4);
  });
});
