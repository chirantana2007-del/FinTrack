jest.mock("../src/config/db", () => ({
  execute: jest.fn(),
  query: jest.fn()
}));

const pool = require("../src/config/db");
const {
  detectSubscriptions,
  syncSubscriptions,
  addInterval
} = require("../src/services/subscription.service");

const charge = (transaction_date, amount, extra = {}) => ({
  transaction_date,
  description: "NETFLIX",
  merchant: "NETFLIX",
  merchant_id: 7,
  category_id: 4,
  amount,
  ...extra
});

describe("Subscription Detection", () => {
  test("detects a monthly subscription after 3 matching charges", () => {
    const result = detectSubscriptions([
      charge("2026-01-05", -649),
      charge("2026-02-05", -649),
      charge("2026-03-05", -649)
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      merchant_id: 7,
      merchant: "NETFLIX",
      amount: 649,
      cadence: "monthly",
      last_charged_date: "2026-03-05",
      next_due_date: "2026-04-05",
      occurrences: 3
    });
  });

  test("needs at least 3 occurrences", () => {
    const result = detectSubscriptions([
      charge("2026-01-05", -649),
      charge("2026-02-05", -649)
    ]);

    expect(result).toHaveLength(0);
  });

  test("allows charge dates to drift by up to 3 days", () => {
    const result = detectSubscriptions([
      charge("2026-01-05", -649),
      charge("2026-02-08", -649),
      charge("2026-03-06", -649)
    ]);

    expect(result).toHaveLength(1);
  });

  test("rejects gaps more than 3 days off the cadence", () => {
    const result = detectSubscriptions([
      charge("2026-01-05", -649),
      charge("2026-02-12", -649),
      charge("2026-03-05", -649)
    ]);

    expect(result).toHaveLength(0);
  });

  test("allows amounts within 5% and rejects amounts beyond it", () => {
    const within = detectSubscriptions([
      charge("2026-01-05", -620),
      charge("2026-02-05", -640),
      charge("2026-03-05", -649)
    ]);
    const beyond = detectSubscriptions([
      charge("2026-01-05", -500),
      charge("2026-02-05", -649),
      charge("2026-03-05", -649)
    ]);

    expect(within).toHaveLength(1);
    expect(beyond).toHaveLength(0);
  });

  test("detects a weekly cadence", () => {
    const result = detectSubscriptions([
      charge("2026-03-02", -99),
      charge("2026-03-09", -99),
      charge("2026-03-16", -99),
      charge("2026-03-23", -99)
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].cadence).toBe("weekly");
    expect(result[0].next_due_date).toBe("2026-03-30");
    expect(result[0].occurrences).toBe(4);
  });

  test("skips unrelated one-off purchases from the same merchant", () => {
    const result = detectSubscriptions([
      charge("2026-01-05", -649, { transaction_id: 1 }),
      charge("2026-01-20", -2500, { transaction_id: 2 }),
      charge("2026-02-05", -649, { transaction_id: 3 }),
      charge("2026-03-05", -649, { transaction_id: 4 })
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].transaction_ids).toEqual([1, 3, 4]);
  });

  test("keeps different merchants separate", () => {
    const result = detectSubscriptions([
      charge("2026-01-05", -649),
      charge("2026-02-05", -649, { merchant_id: 8, merchant: "SPOTIFY" }),
      charge("2026-03-05", -649)
    ]);

    expect(result).toHaveLength(0);
  });

  test("returns an empty array for no transactions", () => {
    expect(detectSubscriptions([])).toEqual([]);
    expect(detectSubscriptions(undefined)).toEqual([]);
  });
});

describe("addInterval", () => {
  test("clamps month-end dates instead of overflowing", () => {
    const jan31 = new Date(Date.UTC(2026, 0, 31));
    expect(addInterval(jan31, "monthly").toISOString().slice(0, 10)).toBe("2026-02-28");
  });

  test("steps backwards for chain matching", () => {
    const mar31 = new Date(Date.UTC(2026, 2, 31));
    expect(addInterval(mar31, "monthly", -1).toISOString().slice(0, 10)).toBe("2026-02-28");
  });
});

describe("syncSubscriptions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const history = [
    { transaction_id: 11, ...charge("2026-01-05", -649) },
    { transaction_id: 12, ...charge("2026-02-05", -649) },
    { transaction_id: 13, ...charge("2026-03-05", -649) }
  ];

  test("inserts a new subscription and flags its transactions as recurring", async () => {
    pool.execute.mockImplementation((sql) => {
      if (sql.includes("FROM Transactions t")) return Promise.resolve([history]);
      if (sql.includes("SELECT subscription_id")) return Promise.resolve([[]]);
      if (sql.includes("INSERT INTO Subscriptions")) return Promise.resolve([{ insertId: 42 }]);
      if (sql.includes("UPDATE Transactions")) return Promise.resolve([{ affectedRows: 3 }]);
      throw new Error(`Unexpected SQL: ${sql}`);
    });

    const result = await syncSubscriptions(1);

    expect(result).toHaveLength(1);
    expect(result[0].subscription_id).toBe(42);

    const insert = pool.execute.mock.calls.find(([sql]) => sql.includes("INSERT INTO Subscriptions"));
    expect(insert[1]).toEqual([1, 7, 4, 649, "monthly", "2026-03-05", "2026-04-05"]);

    const flag = pool.execute.mock.calls.find(([sql]) => sql.includes("UPDATE Transactions"));
    expect(flag[1]).toEqual([11, 12, 13]);
  });

  test("updates the existing row instead of creating a duplicate", async () => {
    pool.execute.mockImplementation((sql) => {
      if (sql.includes("FROM Transactions t")) return Promise.resolve([history]);
      if (sql.includes("SELECT subscription_id")) return Promise.resolve([[{ subscription_id: 5 }]]);
      if (sql.includes("UPDATE Subscriptions")) return Promise.resolve([{ affectedRows: 1 }]);
      if (sql.includes("UPDATE Transactions")) return Promise.resolve([{ affectedRows: 3 }]);
      throw new Error(`Unexpected SQL: ${sql}`);
    });

    const result = await syncSubscriptions(1);

    expect(result[0].subscription_id).toBe(5);
    expect(pool.execute.mock.calls.some(([sql]) => sql.includes("INSERT INTO Subscriptions"))).toBe(false);
  });
});
