const express = require("express");
const request = require("supertest");

const uploadRoutes = require("../src/routes/upload.routes");

const app = express();

app.use(express.json());
app.use("/api/upload", uploadRoutes);

describe("CSV Upload", () => {
  test("should reject request without a CSV file", async () => {
    const response = await request(app)
      .post("/api/upload/csv");

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("CSV file is required");
  });

  test("should parse an uploaded CSV file", async () => {
    const csv = `transaction_date,description,amount
2026-01-01,TEST STORE,500
2026-01-02,COFFEE SHOP,150`;

    const response = await request(app)
      .post("/api/upload/csv")
      .attach("file", Buffer.from(csv), "test.csv");

    expect(response.status).toBe(200);
    expect(response.body.count).toBe(2);
    expect(response.body.transactions[0]).toEqual({
      transaction_date: "2026-01-01",
      description: "TEST STORE",
      amount: 500
    });
  });
});