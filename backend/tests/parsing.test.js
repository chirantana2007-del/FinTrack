const { parseStatement } = require("../src/services/parsing.service");

const csv = (...rows) => ["transaction_date,description,amount", ...rows].join("\n");

describe("parseStatement", () => {
  test("parses valid rows and ignores extra columns", () => {
    const { valid, errors } = parseStatement(
      "transaction_date,description,amount,balance\n2026-10-01,SALARY CREDIT,62000,80500\n2026-10-02,\"ZOMATO, DINNER\",-1340,79160"
    );

    expect(errors).toEqual([]);
    expect(valid).toEqual([
      { transaction_date: "2026-10-01", description: "SALARY CREDIT", amount: 62000 },
      { transaction_date: "2026-10-02", description: "ZOMATO, DINNER", amount: -1340 }
    ]);
  });

  test("rejects a missing required column", () => {
    expect(() => parseStatement("date,description,amount\n2026-10-01,X,1")).toThrow(
      "CSV is missing required column(s): transaction_date"
    );
  });

  test("rejects a file with no data rows", () => {
    expect(() => parseStatement("transaction_date,description,amount\n")).toThrow("CSV file has no data rows");
  });

  test.each([
    ["10/05/2026", "Invalid or missing transaction_date (expected YYYY-MM-DD)"],
    ["2026-02-30", "transaction_date 2026-02-30 is not a real calendar date"],
    ["2026-13-01", "transaction_date 2026-13-01 is not a real calendar date"],
    ["2026-04-31", "transaction_date 2026-04-31 is not a real calendar date"],
    ["2025-02-29", "transaction_date 2025-02-29 is not a real calendar date"],
    ["0000-01-01", "transaction_date 0000-01-01 is not a real calendar date"]
  ])("rejects the date %s", (date, reason) => {
    const { valid, errors } = parseStatement(csv(`${date},GROCERY,-100`));

    expect(valid).toEqual([]);
    expect(errors).toEqual([{ row: 2, reason }]);
  });

  test("accepts 29 February in a leap year", () => {
    const { valid, errors } = parseStatement(csv("2028-02-29,GROCERY,-100"));

    expect(errors).toEqual([]);
    expect(valid).toHaveLength(1);
  });

  test("rejects a missing or over-long description", () => {
    const { errors } = parseStatement(csv("2026-10-01,,-100", `2026-10-01,${"X".repeat(256)},-100`));

    expect(errors).toEqual([
      { row: 2, reason: "Missing description" },
      { row: 3, reason: "Description is longer than 255 characters" }
    ]);
  });

  test("accepts a description of exactly 255 characters", () => {
    const { valid } = parseStatement(csv(`2026-10-01,${"X".repeat(255)},-100`));
    expect(valid).toHaveLength(1);
  });

  test.each([
    ["0", "Invalid or missing amount"],
    ["", "Invalid or missing amount"],
    ["abc", "Invalid or missing amount"],
    ['"-1,000"', "Invalid or missing amount"],
    ["1000000000000", "Amount is too large"]
  ])("rejects the amount %s", (amount, reason) => {
    const { errors } = parseStatement(csv(`2026-10-01,GROCERY,${amount}`));
    expect(errors).toEqual([{ row: 2, reason }]);
  });

  test("keeps good rows when others in the same file are bad", () => {
    const { valid, errors } = parseStatement(
      csv("2026-10-01,SALARY,62000", "2026-02-30,BAD DATE,-50", "2026-10-02,RENT,-15000")
    );

    expect(valid.map((r) => r.description)).toEqual(["SALARY", "RENT"]);
    expect(errors).toEqual([{ row: 3, reason: "transaction_date 2026-02-30 is not a real calendar date" }]);
  });
});
