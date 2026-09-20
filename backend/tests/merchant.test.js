const {
  resolveMerchant,
  resolveMerchants
} = require("../src/services/merchant.service");

describe("Merchant Resolution", () => {
  test("should resolve known merchant names", () => {
    expect(resolveMerchant("SUBWAY")).toBe("Subway");
    expect(resolveMerchant("SWIGGY ORDER #123")).toBe("Swiggy");
    expect(resolveMerchant("UBER TRIP")).toBe("Uber");
    expect(resolveMerchant("AMAZON INDIA")).toBe("Amazon");
  });

  test("should resolve merchant names case-insensitively", () => {
    expect(resolveMerchant("netflix.com")).toBe("Netflix");
    expect(resolveMerchant("Spotify Premium")).toBe("Spotify");
  });

  test("should preserve unknown merchant descriptions", () => {
    expect(resolveMerchant("RANDOM SHOP XYZ")).toBe("RANDOM SHOP XYZ");
  });

  test("should handle missing descriptions", () => {
    expect(resolveMerchant("")).toBe("Unknown");
  });

  test("should resolve merchants for multiple transactions", () => {
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

    const result = resolveMerchants(transactions);

    expect(result[0].merchant).toBe("Subway");
    expect(result[1].merchant).toBe("Uber");
  });
});