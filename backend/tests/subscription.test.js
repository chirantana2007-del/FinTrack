const {
  detectSubscriptions
} = require("../src/services/subscription.service");

describe("Subscription Detection", () => {
  test("should detect a monthly recurring subscription", () => {
    const transactions = [
      {
        transaction_date: "2026-01-05",
        description: "Netflix",
        merchant: "Netflix",
        amount: 649
      },
      {
        transaction_date: "2026-02-05",
        description: "Netflix",
        merchant: "Netflix",
        amount: 649
      },
      {
        transaction_date: "2026-03-05",
        description: "Netflix",
        merchant: "Netflix",
        amount: 649
      }
    ];

    const result = detectSubscriptions(transactions);

    expect(result).toHaveLength(1);
    expect(result[0].merchant).toBe("Netflix");
    expect(result[0].amount).toBe(649);
    expect(result[0].frequency).toBe("monthly");
  });

  test("should not detect a one-time transaction as a subscription", () => {
    const transactions = [
      {
        transaction_date: "2026-01-05",
        description: "Amazon",
        merchant: "Amazon",
        amount: 2000
      }
    ];

    const result = detectSubscriptions(transactions);

    expect(result).toHaveLength(0);
  });

  test("should ignore transactions with very different amounts", () => {
    const transactions = [
      {
        transaction_date: "2026-01-05",
        description: "Netflix",
        merchant: "Netflix",
        amount: 649
      },
      {
        transaction_date: "2026-02-05",
        description: "Netflix",
        merchant: "Netflix",
        amount: 1500
      }
    ];

    const result = detectSubscriptions(transactions);

    expect(result).toHaveLength(0);
  });

  test("should return an empty array for no transactions", () => {
    expect(detectSubscriptions([])).toEqual([]);
  });
});