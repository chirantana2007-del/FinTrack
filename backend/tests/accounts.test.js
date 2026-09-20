const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "test-secret";

jest.mock("../src/config/db", () => ({
    execute: jest.fn()
}));

const pool = require("../src/config/db");
const accountsRoutes = require("../src/routes/accounts.routes");
const { errorHandler } = require("../src/middleware/errorHandler");

const app = express();
app.use(express.json());
app.use("/api/accounts", accountsRoutes);
app.use(errorHandler);

const token = jwt.sign({ id: 1, email: "demo@fintrack.dev", role: "user" }, process.env.JWT_SECRET);

describe("Accounts CRUD", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("rejects requests without auth", async () => {
        const response = await request(app).get("/api/accounts");
        expect(response.status).toBe(401);
    });

    test("lists only the authenticated user's accounts", async () => {
        pool.execute.mockResolvedValue([[{ account_id: 1, account_name: "HDFC Savings" }]]);

        const response = await request(app)
            .get("/api/accounts")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.accounts).toHaveLength(1);
        expect(pool.execute).toHaveBeenCalledWith(expect.stringContaining("WHERE user_id = ?"), [1]);
    });

    test("returns 404 for an account not owned by the user", async () => {
        pool.execute.mockResolvedValue([[]]);

        const response = await request(app)
            .get("/api/accounts/99")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(404);
    });

    test("rejects account creation with missing fields", async () => {
        const response = await request(app)
            .post("/api/accounts")
            .set("Authorization", `Bearer ${token}`)
            .send({ account_name: "My Wallet" });

        expect(response.status).toBe(400);
    });

    test("rejects an invalid account_type", async () => {
        const response = await request(app)
            .post("/api/accounts")
            .set("Authorization", `Bearer ${token}`)
            .send({ account_name: "My Wallet", account_type: "crypto" });

        expect(response.status).toBe(400);
    });

    test("creates an account", async () => {
        pool.execute.mockResolvedValue([{ insertId: 7 }]);

        const response = await request(app)
            .post("/api/accounts")
            .set("Authorization", `Bearer ${token}`)
            .send({ account_name: "My Wallet", account_type: "wallet" });

        expect(response.status).toBe(201);
        expect(response.body.account.account_id).toBe(7);
    });

    test("soft-deletes (deactivates) an account instead of hard-deleting", async () => {
        pool.execute.mockResolvedValue([{ affectedRows: 1 }]);

        const response = await request(app)
            .delete("/api/accounts/1")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(pool.execute).toHaveBeenCalledWith(
            expect.stringContaining("UPDATE Accounts SET is_active = 0"),
            ["1", 1]
        );
    });

    test("returns 404 deleting an account that isn't yours", async () => {
        pool.execute.mockResolvedValue([{ affectedRows: 0 }]);

        const response = await request(app)
            .delete("/api/accounts/99")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(404);
    });
});
