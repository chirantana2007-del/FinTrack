const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "test-secret";

jest.mock("../src/config/db", () => ({
    query: jest.fn()
}));

const pool = require("../src/config/db");
const transactionsRoutes = require("../src/routes/transactions.routes");
const { errorHandler } = require("../src/middleware/errorHandler");

const app = express();
app.use(express.json());
app.use("/api/transactions", transactionsRoutes);
app.use(errorHandler);

const token = jwt.sign({ id: 1, email: "demo@fintrack.dev", role: "user" }, process.env.JWT_SECRET);

describe("Transactions list/search", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("rejects requests without auth", async () => {
        const response = await request(app).get("/api/transactions");
        expect(response.status).toBe(401);
    });

    test("lists transactions scoped to the authenticated user, with default pagination", async () => {
        pool.query
            .mockResolvedValueOnce([[{ total: 2 }]])
            .mockResolvedValueOnce([[{ transaction_id: 1 }, { transaction_id: 2 }]]);

        const response = await request(app)
            .get("/api/transactions")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.total).toBe(2);
        expect(response.body.page).toBe(1);
        expect(response.body.limit).toBe(25);
        expect(pool.query.mock.calls[0][1]).toEqual([1]);
    });

    test("applies filters as additional WHERE conditions with bound params", async () => {
        pool.query
            .mockResolvedValueOnce([[{ total: 0 }]])
            .mockResolvedValueOnce([[]]);

        const response = await request(app)
            .get("/api/transactions?category_id=3&start_date=2026-09-01&end_date=2026-09-30&search=swiggy&needs_review=true")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        const [countSql, countParams] = pool.query.mock.calls[0];
        expect(countSql).toContain("t.category_id = ?");
        expect(countSql).toContain("t.transaction_date >= ?");
        expect(countSql).toContain("t.description LIKE ?");
        expect(countSql).toContain("t.needs_review = ?");
        expect(countParams).toEqual([1, "3", "2026-09-01", "2026-09-30", "%swiggy%", 1]);
    });

    test("clamps limit to the maximum allowed", async () => {
        pool.query
            .mockResolvedValueOnce([[{ total: 0 }]])
            .mockResolvedValueOnce([[]]);

        const response = await request(app)
            .get("/api/transactions?limit=9999")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.limit).toBe(100);
    });
});
