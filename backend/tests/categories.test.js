const express = require("express");
const request = require("supertest");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "test-secret";

jest.mock("../src/config/db", () => ({
    execute: jest.fn()
}));

const pool = require("../src/config/db");
const categoriesRoutes = require("../src/routes/categories.routes");
const { errorHandler } = require("../src/middleware/errorHandler");

const app = express();
app.use(express.json());
app.use("/api/categories", categoriesRoutes);
app.use(errorHandler);

const token = jwt.sign({ id: 1, email: "demo@fintrack.dev", role: "user" }, process.env.JWT_SECRET);

describe("Categories CRUD", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("lists global + own categories", async () => {
        pool.execute.mockResolvedValue([[{ category_id: 1, user_id: null, name: "Food & Dining" }]]);

        const response = await request(app)
            .get("/api/categories")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body.categories).toHaveLength(1);
        expect(pool.execute).toHaveBeenCalledWith(
            expect.stringContaining("WHERE user_id IS NULL OR user_id = ?"),
            [1]
        );
    });

    test("rejects category creation with missing fields", async () => {
        const response = await request(app)
            .post("/api/categories")
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Side Hustle" });

        expect(response.status).toBe(400);
    });

    test("rejects an invalid type", async () => {
        const response = await request(app)
            .post("/api/categories")
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Side Hustle", type: "bogus" });

        expect(response.status).toBe(400);
    });

    test("rejects a parent_category_id that isn't visible to the user", async () => {
        pool.execute.mockResolvedValueOnce([[]]); // parent lookup finds nothing

        const response = await request(app)
            .post("/api/categories")
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Side Hustle", type: "income", parent_category_id: 999 });

        expect(response.status).toBe(400);
    });

    test("creates a category", async () => {
        pool.execute.mockResolvedValueOnce([[]]); // duplicate pre-check: none found
        pool.execute.mockResolvedValueOnce([{ insertId: 20 }]); // insert

        const response = await request(app)
            .post("/api/categories")
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Side Hustle", type: "income" });

        expect(response.status).toBe(201);
        expect(response.body.category.category_id).toBe(20);
    });

    test("returns 409 for a duplicate category name in scope (NULL-safe check, not the DB constraint)", async () => {
        // parent_category_id is NULL for top-level categories, and MySQL unique
        // indexes never treat two NULLs as equal, so this can't rely on a
        // DB-level constraint violation — it must be a NULL-safe pre-check.
        pool.execute.mockResolvedValueOnce([[{ category_id: 5 }]]);

        const response = await request(app)
            .post("/api/categories")
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Groceries", type: "expense" });

        expect(response.status).toBe(409);
        expect(pool.execute).toHaveBeenCalledWith(
            expect.stringContaining("parent_category_id <=> ?"),
            [1, null, "Groceries"]
        );
    });

    test("refuses to edit a category the user doesn't own (including global ones)", async () => {
        pool.execute.mockResolvedValue([[]]);

        const response = await request(app)
            .put("/api/categories/1")
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Renamed" });

        expect(response.status).toBe(404);
    });

    test("refuses to delete a category the user doesn't own", async () => {
        pool.execute.mockResolvedValue([{ affectedRows: 0 }]);

        const response = await request(app)
            .delete("/api/categories/1")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(404);
    });
});
