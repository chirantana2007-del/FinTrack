const {
  categorizeTransaction,
  categorizeTransactions
} = require("../src/services/categorization.service");

describe("Transaction Categorization", () => {
  test("should categorize food transactions", () => {
    expect(categorizeTransaction("SUBWAY")).toBe("Food");
    expect(categorizeTransaction("Swiggy order")).toBe("Food");
  });

  test("should categorize transport transactions", () => {
    expect(categorizeTransaction("UBER TRIP")).toBe("Transport");
  });

  test("should categorize entertainment transactions", () => {
    expect(categorizeTransaction("NETFLIX")).toBe("Entertainment");
  });

  test("should categorize unknown transactions as Other", () => {
    expect(categorizeTransaction("RANDOM MERCHANT XYZ")).toBe("Other");
  });

  test("should categorize multiple transactions", () => {
    const transactions = [
      {
        transaction_date: "2026-01-01",
        description: "SUBWAY",
        amount: 500
      },
      {
        transaction_date: "2026-01-02",
        description: "UBER",
        amount: 300
      }
    ];

    const result = categorizeTransactions(transactions);

    expect(result[0].category).toBe("Food");
    expect(result[1].category).toBe("Transport");
  });
});