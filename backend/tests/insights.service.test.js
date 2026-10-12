jest.mock("../src/config/db", () => ({
  query: jest.fn(),
  execute: jest.fn()
}));

const { detectAnomalies, categoryStats, percentile, MIN_SAMPLES } = require("../src/services/anomaly.service");
const { buildForecast } = require("../src/services/prediction.service");
const { interpretQuestion, buildQuery } = require("../src/services/nlquery.service");

const txn = (id, spent, extra = {}) => ({
  transaction_id: id,
  category_id: 3,
  category_name: "Restaurants",
  merchant_name: "SWIGGY ORDER",
  description: "SWIGGY ORDER",
  transaction_date: `2026-08-${String(id).padStart(2, "0")}`,
  spent,
  ...extra
});

// Nine ordinary orders around ₹450 plus one ₹4,000 order.
const ordinary = [450, 470, 430, 500, 460, 440, 480, 455, 465];
const withOutlier = [...ordinary.map((v, i) => txn(i + 1, v)), txn(10, 4000)];

describe("Anomaly detection", () => {
  test("flags an unusually large spend with both the Z-score and IQR rules", () => {
    const flagged = detectAnomalies(withOutlier);

    expect(flagged).toHaveLength(1);
    expect(flagged[0]).toMatchObject({ id: 10, amount: 4000, category: "Restaurants", merchant: "SWIGGY ORDER" });
    expect(flagged[0].methods).toEqual(["z-score", "iqr"]);
    expect(flagged[0].zScore).toBeGreaterThan(2);
    expect(flagged[0].reason).toMatch(/standard deviations above the Restaurants average/);
    expect(flagged[0].reason).toMatch(/upper limit/);
  });

  test("works on the positive size of a debit, so big spends are the ones flagged", () => {
    // The old code compared signed amounts against a positive threshold, so
    // the ₹4,000 order (stored as -4000) could never be caught.
    const flagged = detectAnomalies(withOutlier);
    expect(flagged.every((f) => f.amount > 0)).toBe(true);
    expect(flagged.map((f) => f.id)).toEqual([10]);
  });

  test("does not flag a small amount, however unusual", () => {
    const flagged = detectAnomalies([...ordinary.map((v, i) => txn(i + 1, v)), txn(10, 5)]);
    expect(flagged).toEqual([]);
  });

  test("ignores a category with too little history", () => {
    const few = [450, 470, 430, 500, 4000].map((v, i) => txn(i + 1, v));
    expect(few.length).toBeLessThan(MIN_SAMPLES);
    expect(detectAnomalies(few)).toEqual([]);
  });

  test("keeps categories separate", () => {
    const rent = Array.from({ length: 9 }, (_, i) =>
      txn(20 + i, 15000, { category_id: 8, category_name: "Housing" })
    );
    // ₹4,000 is routine for Housing but an outlier for Restaurants.
    const flagged = detectAnomalies([...withOutlier, ...rent, txn(30, 4000, { category_id: 8, category_name: "Housing" })]);
    expect(flagged.map((f) => f.category)).toEqual(expect.arrayContaining(["Restaurants"]));
    expect(flagged.find((f) => f.id === 10)).toBeDefined();
  });

  test("the IQR rule still catches an outlier when a huge payment has inflated the Z-score's yardstick", () => {
    // One enormous payment (₹60,000) stretches the standard deviation so far
    // that the ₹2,000 payment stays under z = 2, while the quartiles, which
    // only a small minority of outliers can move, are untouched.
    const amounts = [100, 110, 105, 95, 102, 98, 108, 101, 99, 104, 106, 97, 2000, 60000];
    const flagged = detectAnomalies(amounts.map((v, i) => txn(i + 1, v)));
    const small = flagged.find((f) => f.amount === 2000);

    expect(small).toBeDefined();
    expect(small.methods).toEqual(["iqr"]);
    expect(small.zScore).toBeLessThanOrEqual(2);
  });

  test("leaves identical payments alone (IQR of zero) and lets the Z-score judge", () => {
    const steady = Array.from({ length: 10 }, (_, i) => txn(i + 1, 499));
    expect(detectAnomalies(steady)).toEqual([]);

    const flagged = detectAnomalies([...steady, txn(11, 5000)]);
    expect(flagged.map((f) => f.id)).toEqual([11]);
    expect(flagged[0].methods).toEqual(["z-score"]);
    expect(flagged[0].upperFence).toBeNull();
  });

  test("returns the newest first", () => {
    const early = txn(1, 9000, { transaction_date: "2026-03-01" });
    const late = txn(2, 9000, { transaction_date: "2026-09-01" });
    const filler = ordinary.map((v, i) => txn(i + 3, v, { transaction_date: `2026-05-${String(i + 1).padStart(2, "0")}` }));
    const flagged = detectAnomalies([early, ...filler, late]);
    expect(flagged.map((f) => f.id)).toEqual([2, 1]);
  });

  test("percentile interpolates between ranks", () => {
    expect(percentile([1, 2, 3, 4], 0.5)).toBe(2.5);
    expect(percentile([1, 2, 3, 4, 5], 0.25)).toBe(2);
    const stats = categoryStats([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(stats).toMatchObject({ count: 8, mean: 4.5, q1: 2.75, q3: 6.25, iqr: 3.5 });
  });
});

describe("Spend forecast", () => {
  const rows = [
    { category_name: "Fuel", month: "2026-07", spent: 1000 },
    { category_name: "Fuel", month: "2026-08", spent: 1200 },
    { category_name: "Fuel", month: "2026-09", spent: 1500 },
    { category_name: "Fuel", month: "2026-10", spent: 100 },
    { category_name: "Housing", month: "2026-07", spent: 15000 },
    { category_name: "Housing", month: "2026-08", spent: 15000 },
    { category_name: "Housing", month: "2026-09", spent: 15000 },
    { category_name: "Shopping", month: "2026-09", spent: 3000 }
  ];
  const october = new Date(2026, 9, 12);

  test("averages the last three complete months and leaves out the month in progress", () => {
    const { predictions, basis } = buildForecast(rows, { now: october });

    expect(basis).toEqual({ months: ["2026-07", "2026-08", "2026-09"], monthsUsed: 3, partialMonthExcluded: true });
    expect(predictions.Fuel.value).toBeCloseTo(1233.33, 2);
    expect(predictions.Fuel.months).toEqual({ Jul: 1000, Aug: 1200, Sep: 1500 });
    expect(predictions.Housing.value).toBe(15000);
  });

  test("reports spending as positive amounts with a working trend", () => {
    const { predictions } = buildForecast(rows, { now: october });

    expect(predictions.Fuel.value).toBeGreaterThan(0);
    expect(predictions.Fuel.trend).toBe("+25.0%"); // 1,500 vs 1,200
    expect(predictions.Housing.trend).toBe("+0.0%");
  });

  test("counts a month with no spend as zero, and marks a brand-new category as New", () => {
    const { predictions } = buildForecast(rows, { now: october });

    expect(predictions.Shopping.value).toBe(1000); // 3,000 over three months
    expect(predictions.Shopping.trend).toBe("New");
    expect(predictions.Shopping.months).toEqual({ Jul: 0, Aug: 0, Sep: 3000 });
  });

  test("keeps only the categories with the highest forecast", () => {
    const { predictions } = buildForecast(rows, { now: october, topCategories: 2 });

    expect(Object.keys(predictions)).toEqual(["Housing", "Fuel"]);
  });

  test("shows a falling trend with a minus sign", () => {
    const falling = [
      { category_name: "Fuel", month: "2026-08", spent: 2000 },
      { category_name: "Fuel", month: "2026-09", spent: 1500 }
    ];
    expect(buildForecast(falling, { now: october }).predictions.Fuel.trend).toBe("-25.0%");
  });

  test("keeps the current month when it is the only data there is", () => {
    const { predictions, basis } = buildForecast([{ category_name: "Fuel", month: "2026-10", spent: 800 }], { now: october });
    expect(basis.partialMonthExcluded).toBe(false);
    expect(predictions.Fuel.value).toBe(800);
  });

  test("returns nothing for a user with no spending", () => {
    expect(buildForecast([], { now: october })).toEqual({ predictions: {}, basis: null });
  });
});

describe("Question interpretation", () => {
  const now = new Date(2026, 9, 12); // 12 October 2026

  test.each([
    ["how much did I spend on food", "Food & dining spending, all time"],
    ["how much did I spend on groceries", "Groceries spending, all time"],
    ["how much did I spend on fuel", "Fuel spending, all time"],
    ["how much did I spend on Uber", "Public transit spending, all time"],
    ["what is my rent", "Housing spending, all time"],
    ["how much did I spend on netflix", "Subscriptions spending, all time"]
  ])("%s -> %s", (question, expected) => {
    expect(interpretQuestion(question, now).interpretation).toBe(expected);
  });

  test("healthcare is Healthcare, not transport (the old pattern matched 'car' inside 'healthcare')", () => {
    expect(interpretQuestion("how much did I spend on healthcare", now).categoryLabel).toBe("Healthcare");
  });

  test.each([
    ["food last month", "2026-09-01", "2026-10-01", "September 2026"],
    ["food this month", "2026-10-01", "2026-11-01", "October 2026"],
    ["food in august", "2026-08-01", "2026-09-01", "August 2026"],
    ["food in March 2025", "2025-03-01", "2025-04-01", "March 2025"],
    ["food in december", "2025-12-01", "2026-01-01", "December 2025"]
  ])("understands the period in %p", (question, start, end, label) => {
    expect(interpretQuestion(question, now).period).toEqual({ start, end, label });
  });

  test("last month wraps back across New Year", () => {
    expect(interpretQuestion("food last month", new Date(2026, 0, 15)).period).toEqual({
      start: "2025-12-01",
      end: "2026-01-01",
      label: "December 2025"
    });
  });

  test("'may' is only a month when the phrasing makes it one", () => {
    expect(interpretQuestion("may I see my total spending", now).period).toBeNull();
    expect(interpretQuestion("fuel in may", now).period.label).toBe("May 2026");
    expect(interpretQuestion("fuel may 2025", now).period.label).toBe("May 2025");
  });

  test("says so when no category was recognised instead of silently answering something else", () => {
    expect(interpretQuestion("how much did I spend on zebras", now).interpretation).toBe(
      "Total spending, all time (no category recognised in your question)"
    );
    expect(interpretQuestion("what is my total spending", now).interpretation).toBe("Total spending, all time");
  });

  test("recognises a largest-expense question", () => {
    const intent = interpretQuestion("what was my highest expense in september", now);
    expect(intent.kind).toBe("max");
    expect(intent.interpretation).toBe("Largest single expense, September 2026");
  });
});

describe("Question SQL", () => {
  const now = new Date(2026, 9, 12);

  test("sums positive spend over debits only, scoped to the user", () => {
    const { sql, params } = buildQuery(interpretQuestion("how much did I spend", now), 7);

    expect(sql).toContain("SUM(-t.amount)");
    expect(sql).toContain("t.amount < 0");
    expect(sql).not.toContain("Categories");
    expect(params).toEqual([7]);
  });

  test("binds category patterns and the date range as parameters, never as SQL text", () => {
    const { sql, params } = buildQuery(interpretQuestion("food last month", now), 7);

    expect(sql).toContain("c.name LIKE ? OR c.name LIKE ? OR c.name LIKE ?");
    expect(sql).not.toMatch(/Food|2026-09/);
    expect(params).toEqual([7, "%Food%", "%Restaurant%", "%Groceries%", "2026-09-01", "2026-10-01"]);
  });

  test("a largest-expense question returns the biggest debit", () => {
    const { sql } = buildQuery(interpretQuestion("biggest expense", now), 7);
    expect(sql).toContain("ORDER BY t.amount ASC");
    expect(sql).toContain("LIMIT 1");
  });

  test("question text can't inject SQL", () => {
    const intent = interpretQuestion("food'; DROP TABLE Users; --", now);
    const { sql, params } = buildQuery(intent, 7);
    expect(sql).not.toMatch(/DROP/i);
    expect(params.join(" ")).not.toMatch(/DROP/i);
  });
});
