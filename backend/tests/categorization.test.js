jest.mock("../src/config/db", () => ({
  execute: jest.fn(),
  query: jest.fn()
}));

const pool = require("../src/config/db");
const {
  categorizeTransaction,
  categorizeTransactions
} = require("../src/services/categorization.service");

describe("Transaction Categorization", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("matches the user's own CategoryRules by priority", async () => {
    pool.execute.mockResolvedValue([
      [{ category_id: 3, match_type: "contains", pattern: "swiggy" }]
    ]);

    const result = await categorizeTransaction("SWIGGY ORDER #123", 1);

    expect(result).toEqual({ categoryId: 3, needsReview: false });
    expect(pool.query).not.toHaveBeenCalled();
  });

  test("falls back to fn_categorize_transaction when no user rule matches", async () => {
    pool.execute.mockResolvedValue([[]]);
    pool.query.mockResolvedValue([[{ category_id: 7 }]]);

    const result = await categorizeTransaction("NETFLIX SUBSCRIPTION", 1);

    expect(result).toEqual({ categoryId: 7, needsReview: false });
    expect(pool.query).toHaveBeenCalledWith(
      "SELECT fn_categorize_transaction(?) AS category_id",
      ["NETFLIX SUBSCRIPTION"]
    );
  });

  test("flags as needing review when nothing matches", async () => {
    pool.execute.mockResolvedValue([[]]);
    pool.query.mockResolvedValue([[{ category_id: null }]]);

    const result = await categorizeTransaction("RANDOM MERCHANT XYZ", 1);

    expect(result).toEqual({ categoryId: null, needsReview: true });
  });

  test("categorizes multiple transactions", async () => {
    pool.execute.mockResolvedValue([[]]);
    pool.query
      .mockResolvedValueOnce([[{ category_id: 3 }]])
      .mockResolvedValueOnce([[{ category_id: 6 }]]);

    const transactions = [
      { transaction_date: "2026-01-01", description: "SUBWAY", amount: 500 },
      { transaction_date: "2026-01-02", description: "UBER", amount: 300 }
    ];

    const result = await categorizeTransactions(transactions, 1);

    expect(result[0].categoryId).toBe(3);
    expect(result[1].categoryId).toBe(6);
  });
});
