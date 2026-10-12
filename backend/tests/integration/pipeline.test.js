// End-to-end: upload -> parse -> merchant resolution -> categorization ->
// MonthlySummary (trigger) -> budgets / notifications / report, against a
// real MySQL database built from src/db/*.sql (see jest.integration.config.js).
const fs = require("fs");
const path = require("path");
const request = require("supertest");

const app = require("../../src/app");
const pool = require("../../src/config/db");

const DATA_DIR = path.join(__dirname, "../../../data");
const DEMO_CSV = path.join(DATA_DIR, "demo_statement.csv");
const HISTORY_CSV = path.join(DATA_DIR, "subscription_history.csv");
const MONTH = "2026-09";
const PERIOD = "2026-09-01";

// Expected values are derived from the CSV itself rather than hardcoded.
// (These files have no quoted fields, so a plain split is enough.)
function readCsvRows(file) {
  const [, ...lines] = fs.readFileSync(file, "utf8").trim().split(/\r?\n/);
  return lines.map((line) => {
    const [transaction_date, description, amount] = line.split(",");
    return { transaction_date, description, amount: Number(amount) };
  });
}

const demoRows = readCsvRows(DEMO_CSV);
const validDemoRows = demoRows.filter((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.transaction_date));
const sum = (rows) => rows.reduce((total, r) => total + r.amount, 0);
const round2 = (n) => Math.round(n * 100) / 100;

let token;
let userId;
let accountId;
const categoryIds = {};

const auth = (req) => req.set("Authorization", `Bearer ${token}`);

async function categoryId(name) {
  if (!categoryIds[name]) {
    const [[row]] = await pool.query("SELECT category_id FROM Categories WHERE name = ? AND user_id IS NULL", [name]);
    categoryIds[name] = row.category_id;
  }
  return categoryIds[name];
}

async function summaryRows() {
  const [rows] = await pool.query(
    `SELECT category_id, total_income, total_expense, net_amount
     FROM MonthlySummary WHERE user_id = ? AND period_month = ?
     ORDER BY category_id IS NULL, category_id`,
    [userId, PERIOD]
  );
  return rows;
}

beforeAll(async () => {
  const email = "integration@fintrack.test";
  const register = await request(app)
    .post("/api/auth/register")
    .send({ name: "Integration User", email, password: "s3cret-pass" });
  expect(register.status).toBe(201);
  userId = register.body.user.id;

  const login = await request(app).post("/api/auth/login").send({ email, password: "s3cret-pass" });
  expect(login.status).toBe(200);
  token = login.body.token;

  const [[account]] = await pool.query("SELECT account_id FROM Accounts WHERE user_id = ?", [userId]);
  accountId = account.account_id;
});

afterAll(async () => {
  await pool.end();
});

describe("Registration", () => {
  test("creates the user's settings and a default account", async () => {
    const [[settings]] = await pool.query("SELECT COUNT(*) AS n FROM UserSettings WHERE user_id = ?", [userId]);
    expect(settings.n).toBe(1);
    expect(accountId).toBeTruthy();
  });

  test("records register and login in the audit log", async () => {
    const [rows] = await pool.query("SELECT action FROM AuditLog WHERE user_id = ? ORDER BY audit_id", [userId]);
    expect(rows.map((r) => r.action)).toEqual(["auth.register", "auth.login"]);
  });
});

describe("Upload -> categorize -> summary pipeline", () => {
  let uploadBody;

  beforeAll(async () => {
    // A tight Restaurants budget so the trigger's alert path is exercised.
    const budget = await auth(request(app).post("/api/budgets")).send({
      category_id: await categoryId("Restaurants"),
      limit_amount: 1000,
      period_month: MONTH
    });
    expect(budget.status).toBe(201);

    const upload = await auth(request(app).post("/api/upload/csv")).attach("file", DEMO_CSV);
    expect(upload.status).toBe(200);
    uploadBody = upload.body;
  });

  test("inserts every valid row and reports the broken one", () => {
    expect(uploadBody.insertedCount).toBe(validDemoRows.length);
    expect(uploadBody.failedCount).toBe(demoRows.length - validDemoRows.length);
    expect(uploadBody.errors[0].reason).toMatch(/transaction_date/);
  });

  test("records the upload in UploadedFiles", async () => {
    const [[file]] = await pool.query("SELECT * FROM UploadedFiles WHERE file_id = ?", [uploadBody.uploadedFileId]);
    expect(file).toMatchObject({
      user_id: userId,
      account_id: accountId,
      status: "completed",
      total_rows: demoRows.length,
      inserted_rows: validDemoRows.length,
      failed_rows: 1
    });
  });

  test("stores the transactions with their signed amounts", async () => {
    const [rows] = await pool.query(
      "SELECT COUNT(*) AS n, SUM(amount) AS total FROM Transactions WHERE account_id = ?",
      [accountId]
    );
    expect(rows[0].n).toBe(validDemoRows.length);
    expect(Number(rows[0].total)).toBeCloseTo(sum(validDemoRows), 2);
  });

  test("resolves different order numbers to the same merchant", async () => {
    const [rows] = await pool.query(
      "SELECT DISTINCT merchant_id FROM Transactions WHERE account_id = ? AND description LIKE 'SWIGGY ORDER %'",
      [accountId]
    );
    expect(rows).toHaveLength(1);
    const [[merchant]] = await pool.query("SELECT canonical_name FROM Merchants WHERE merchant_id = ?", [rows[0].merchant_id]);
    expect(merchant.canonical_name).toBe("SWIGGY ORDER");
  });

  test("categorizes rows through the rules and flags unknown ones for review", async () => {
    const expectations = [
      ["SWIGGY ORDER 48213", "Restaurants"],
      ["ZOMATO FOOD ORDER", "Restaurants"],
      ["BIGBASKET GROCERY", "Groceries"],
      ["SALARY CREDIT SEPTEMBER", "Salary"],
      ["RENT PAYMENT SEPTEMBER", "Housing"]
    ];
    for (const [description, category] of expectations) {
      const [[row]] = await pool.query(
        "SELECT category_id, needs_review FROM Transactions WHERE account_id = ? AND description = ?",
        [accountId, description]
      );
      expect({ description, category_id: row.category_id }).toEqual({ description, category_id: await categoryId(category) });
      expect(row.needs_review).toBe(0);
    }

    const [[unknown]] = await pool.query(
      "SELECT category_id, needs_review FROM Transactions WHERE account_id = ? AND description = 'LOCAL CORNER STORE XYZ'",
      [accountId]
    );
    expect(unknown).toEqual({ category_id: null, needs_review: 1 });
  });

  test("the insert trigger keeps MonthlySummary in step with the transactions", async () => {
    const rows = await summaryRows();
    const restaurants = rows.find((r) => r.category_id === categoryIds.Restaurants);
    const expectedRestaurantSpend = -sum(validDemoRows.filter((r) => /SWIGGY|ZOMATO/.test(r.description)));
    expect(Number(restaurants.total_expense)).toBeCloseTo(expectedRestaurantSpend, 2);

    const totalIncome = rows.reduce((s, r) => s + Number(r.total_income), 0);
    const totalExpense = rows.reduce((s, r) => s + Number(r.total_expense), 0);
    expect(totalIncome).toBeCloseTo(sum(validDemoRows.filter((r) => r.amount > 0)), 2);
    expect(totalExpense).toBeCloseTo(-sum(validDemoRows.filter((r) => r.amount < 0)), 2);
  });

  test("a full recompute with sp_generate_monthly_summary matches the trigger's running totals", async () => {
    const incremental = await summaryRows();
    await pool.query("CALL sp_generate_monthly_summary(?, ?)", [userId, PERIOD]);
    const recomputed = await summaryRows();
    expect(recomputed).toEqual(incremental);
  });

  test("the budget API reports spend read from MonthlySummary", async () => {
    const response = await auth(request(app).get(`/api/budgets?month=${MONTH}`));
    expect(response.status).toBe(200);
    const [budget] = response.body.budgets;
    expect(budget.category_name).toBe("Restaurants");
    expect(Number(budget.spent)).toBeCloseTo(-sum(validDemoRows.filter((r) => /SWIGGY|ZOMATO/.test(r.description))), 2);
  });

  test("crossing the budget raises one threshold alert and one exceeded alert", async () => {
    const response = await auth(request(app).get("/api/notifications"));
    const alerts = response.body.notifications.filter((n) => n.type === "budget_alert");
    expect(alerts).toHaveLength(2);
    expect(alerts.map((n) => n.message).sort()).toEqual([
      expect.stringMatching(/^Budget exceeded for Restaurants/),
      expect.stringMatching(/^Budget threshold reached for Restaurants/)
    ]);
    expect(response.body.unreadCount).toBeGreaterThanOrEqual(2);
  });

  test("the monthly report totals match the uploaded statement", async () => {
    const response = await auth(request(app).get(`/api/reports/summary?month=${MONTH}`));
    expect(response.status).toBe(200);
    const { totals } = response.body.data;
    expect(totals.income).toBeCloseTo(sum(validDemoRows.filter((r) => r.amount > 0)), 2);
    expect(totals.expense).toBeCloseTo(-sum(validDemoRows.filter((r) => r.amount < 0)), 2);
    expect(totals.transactionCount).toBe(validDemoRows.length);
  });
});

describe("Re-uploading the same statement", () => {
  test("skips every row as a duplicate and leaves the totals unchanged", async () => {
    const before = await summaryRows();

    const response = await auth(request(app).post("/api/upload/csv")).attach("file", DEMO_CSV);

    expect(response.status).toBe(200);
    expect(response.body.insertedCount).toBe(0);
    expect(response.body.duplicateCount).toBe(validDemoRows.length);
    const [[count]] = await pool.query("SELECT COUNT(*) AS n FROM Transactions WHERE account_id = ?", [accountId]);
    expect(count.n).toBe(validDemoRows.length);
    expect(await summaryRows()).toEqual(before);
  });
});

describe("Rows MySQL would reject", () => {
  // In strict mode MySQL refuses an impossible date or an over-long
  // description, and the upload runs in one transaction, so before the parser
  // checked these, one such row rolled back the entire file.
  test("are skipped as row errors while the rest of the file is saved", async () => {
    const file = Buffer.from(
      [
        "transaction_date,description,amount",
        "2026-08-03,STRICT MODE GOOD ROW ONE,-210",
        "2026-02-30,IMPOSSIBLE DATE,-99",
        `2026-08-04,${"X".repeat(300)},-50`,
        "2026-08-05,STRICT MODE GOOD ROW TWO,-320"
      ].join("\n")
    );

    const response = await auth(request(app).post("/api/upload/csv")).attach("file", file, "strict_mode.csv");

    expect(response.status).toBe(200);
    expect(response.body.insertedCount).toBe(2);
    expect(response.body.errors.map((e) => e.row)).toEqual([3, 4]);
    const [[saved]] = await pool.query(
      "SELECT COUNT(*) AS n FROM Transactions WHERE account_id = ? AND description LIKE 'STRICT MODE GOOD ROW %'",
      [accountId]
    );
    expect(saved.n).toBe(2);
  });
});

describe("Subscription detection after upload", () => {
  let response;

  beforeAll(async () => {
    response = await auth(request(app).post("/api/upload/csv")).attach("file", HISTORY_CSV);
  });

  test("detects merchants charged on a steady monthly cadence", async () => {
    expect(response.status).toBe(200);
    const [rows] = await pool.query(
      `SELECT m.canonical_name, s.amount, s.cadence, s.last_charged_date, s.next_due_date
       FROM Subscriptions s JOIN Merchants m ON m.merchant_id = s.merchant_id
       WHERE s.user_id = ? ORDER BY m.canonical_name`,
      [userId]
    );
    expect(rows.map((r) => r.canonical_name)).toEqual([
      "AMAZON PRIME MEMBERSHIP",
      "BROADBAND INTERNET BILL",
      "CULTFIT GYM MEMBERSHIP",
      "NETFLIX SUBSCRIPTION",
      "SPOTIFY PREMIUM"
    ]);
    expect(response.body.subscriptionsDetected).toBe(rows.length);

    const netflix = rows.find((r) => r.canonical_name === "NETFLIX SUBSCRIPTION");
    expect(netflix).toMatchObject({ cadence: "monthly", last_charged_date: "2026-09-06", next_due_date: "2026-10-06" });
    expect(Number(netflix.amount)).toBe(499);
  });

  test("leaves out a bill whose amount varies by more than 5%", async () => {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS n FROM Subscriptions s JOIN Merchants m ON m.merchant_id = s.merchant_id
       WHERE s.user_id = ? AND m.canonical_name LIKE 'ELECTRICITY%'`,
      [userId]
    );
    expect(rows[0].n).toBe(0);
  });

  test("flags the matched charges as recurring", async () => {
    const [[row]] = await pool.query(
      "SELECT COUNT(*) AS n FROM Transactions WHERE account_id = ? AND is_recurring = 1",
      [accountId]
    );
    expect(row.n).toBe(15); // 5 subscriptions x 3 charges
  });
});
