const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "test-secret";

jest.mock("../src/config/db", () => ({
    execute: jest.fn()
}));

const pool = require("../src/config/db");
const budgetsRoutes = require("../src/routes/budgets.routes");
const { errorHandler } = require("../src/middleware/errorHandler");

const app = express();
app.use(express.json());
app.use("/api/budgets", budgetsRoutes);
app.use(errorHandler);

const token = jwt.sign({ id: 1, email: "demo@fintrack.dev", role: "user" }, process.env.JWT_SECRET);

describe("Budgets CRUD + progress", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("lists budgets with progress read from MonthlySummary, defaulting to the current month", async () => {
        pool.execute.mockResolvedValue([
            [{ budget_id: 1, category_id: 3, category_name: "Restaurants", period_month: "2026-09-01", limit_amount: "1000.00", spent: "850.00", progress_pct: "85.00" }]
        ]);

        const response = await request(app)
            .get("/api/budgets")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.budgets).toHaveLength(1);
        expect(response.body.budgets[0].progress_pct).toBe("85.00");
        expect(pool.execute).toHaveBeenCalledWith(
            expect.stringContaining("LEFT JOIN MonthlySummary"),
            expect.any(Array)
        );
    });

    test("accepts an explicit ?month filter", async () => {
        pool.execute.mockResolvedValue([[]]);

        const response = await request(app)
            .get("/api/budgets?month=2026-01")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.periodMonth).toBe("2026-01-01");
        expect(pool.execute).toHaveBeenCalledWith(expect.any(String), [1, "2026-01-01"]);
    });

    test("rejects budget creation with missing fields", async () => {
        const response = await request(app)
            .post("/api/budgets")
            .set("Authorization", `Bearer ${token}`)
            .send({ category_id: 3 });

        expect(response.status).toBe(400);
    });

    test("rejects a non-positive limit_amount", async () => {
        const response = await request(app)
            .post("/api/budgets")
            .set("Authorization", `Bearer ${token}`)
            .send({ category_id: 3, limit_amount: 0, period_month: "2026-09" });

        expect(response.status).toBe(400);
    });

    test("rejects a category_id not visible to the user", async () => {
        pool.execute.mockResolvedValueOnce([[]]);

        const response = await request(app)
            .post("/api/budgets")
            .set("Authorization", `Bearer ${token}`)
            .send({ category_id: 999, limit_amount: 500, period_month: "2026-09" });

        expect(response.status).toBe(400);
    });

    test("creates a budget", async () => {
        pool.execute.mockResolvedValueOnce([[{ category_id: 3 }]]); // category visibility check
        pool.execute.mockResolvedValueOnce([{ insertId: 5 }]); // insert

        const response = await request(app)
            .post("/api/budgets")
            .set("Authorization", `Bearer ${token}`)
            .send({ category_id: 3, limit_amount: 1000, period_month: "2026-09" });

        expect(response.status).toBe(201);
        expect(response.body.budget.budget_id).toBe(5);
    });

    test("returns 409 for a duplicate budget (category+month already budgeted)", async () => {
        const dupError = new Error("Duplicate entry");
        dupError.code = "ER_DUP_ENTRY";
        pool.execute.mockResolvedValueOnce([[{ category_id: 3 }]]);
        pool.execute.mockRejectedValueOnce(dupError);

        const response = await request(app)
            .post("/api/budgets")
            .set("Authorization", `Bearer ${token}`)
            .send({ category_id: 3, limit_amount: 1000, period_month: "2026-09" });

        expect(response.status).toBe(409);
    });

    test("updates a budget's limit", async () => {
        pool.execute.mockResolvedValue([{ affectedRows: 1 }]);

        const response = await request(app)
            .put("/api/budgets/1")
            .set("Authorization", `Bearer ${token}`)
            .send({ limit_amount: 1500 });

        expect(response.status).toBe(200);
    });

    test("returns 404 updating a budget that isn't yours", async () => {
        pool.execute.mockResolvedValue([{ affectedRows: 0 }]);

        const response = await request(app)
            .put("/api/budgets/99")
            .set("Authorization", `Bearer ${token}`)
            .send({ limit_amount: 1500 });

        expect(response.status).toBe(404);
    });

    test("deletes a budget", async () => {
        pool.execute.mockResolvedValue([{ affectedRows: 1 }]);

        const response = await request(app)
            .delete("/api/budgets/1")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
    });
});
