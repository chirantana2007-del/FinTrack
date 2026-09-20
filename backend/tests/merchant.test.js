jest.mock("../src/config/db", () => ({
  execute: jest.fn(),
  query: jest.fn()
}));

const pool = require("../src/config/db");
const {
  resolveMerchant,
  normalizeMerchantName,
  levenshteinDistance
} = require("../src/services/merchant.service");

describe("Merchant name normalization", () => {
  test("strips noise tokens and trailing numeric ids", () => {
    expect(normalizeMerchantName("SWIGGY ORDER UPI/123456789")).toBe("SWIGGY ORDER");
    expect(normalizeMerchantName("AMAZON.IN 998877")).toBe("AMAZON.IN");
  });

  test("handles missing description", () => {
    expect(normalizeMerchantName("")).toBe("");
  });
});

describe("Levenshtein distance", () => {
  test("computes edit distance", () => {
    expect(levenshteinDistance("SWIGGY", "SWIGGY")).toBe(0);
    expect(levenshteinDistance("SWIGGY", "SWIGY")).toBe(1);
    expect(levenshteinDistance("SWIGGY", "ZOMATO")).toBeGreaterThan(2);
  });
});

describe("Merchant Resolution", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns an exact canonical_name match without inserting", async () => {
    pool.execute.mockResolvedValueOnce([
      [{ merchant_id: 1, canonical_name: "SWIGGY", default_category_id: 3 }]
    ]);

    const result = await resolveMerchant("SWIGGY ORDER #123");

    expect(result).toEqual({ merchant_id: 1, canonical_name: "SWIGGY", default_category_id: 3 });
  });

  test("falls back to a fuzzy match within edit distance 2", async () => {
    pool.execute.mockResolvedValueOnce([[]]); // no exact match
    pool.query.mockResolvedValueOnce([
      [{ merchant_id: 2, canonical_name: "SWIGGY", default_category_id: 3 }]
    ]);

    const result = await resolveMerchant("SWIGY");

    expect(result.merchant_id).toBe(2);
  });

  test("inserts a new merchant when nothing matches", async () => {
    pool.execute.mockResolvedValueOnce([[]]); // no exact match
    pool.query.mockResolvedValueOnce([[]]); // no fuzzy match
    pool.execute.mockResolvedValueOnce([{ insertId: 99 }]); // insert

    const result = await resolveMerchant("BRAND NEW MERCHANT");

    expect(result).toEqual({
      merchant_id: 99,
      canonical_name: "BRAND NEW MERCHANT",
      default_category_id: null
    });
  });

  test("returns null for an empty description", async () => {
    const result = await resolveMerchant("");
    expect(result).toBeNull();
  });
});
