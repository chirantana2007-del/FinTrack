const { parse } = require("csv-parse/sync");

const REQUIRED_COLUMNS = ["transaction_date", "description", "amount"];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Parses the CSV and validates it row by row. Invalid rows are collected as
// errors and excluded, not thrown — a few bad rows shouldn't abort the whole
// batch. A structurally broken file (missing columns, no rows) does throw,
// since there's nothing valid to salvage.
const parseStatement = (csvData) => {
  if (!csvData) {
    throw new Error("CSV data is required");
  }

  const records = parse(csvData, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  if (records.length === 0) {
    throw new Error("CSV file has no data rows");
  }

  const header = Object.keys(records[0]);
  const missingColumns = REQUIRED_COLUMNS.filter((col) => !header.includes(col));
  if (missingColumns.length > 0) {
    throw new Error(`CSV is missing required column(s): ${missingColumns.join(", ")}`);
  }

  const valid = [];
  const errors = [];

  records.forEach((row, index) => {
    const rowNumber = index + 2; // +1 for header row, +1 for 1-indexing
    const description = (row.description || "").trim();
    const amount = Number(row.amount);

    if (!row.transaction_date || !DATE_PATTERN.test(row.transaction_date)) {
      errors.push({ row: rowNumber, reason: "Invalid or missing transaction_date (expected YYYY-MM-DD)" });
      return;
    }
    if (!description) {
      errors.push({ row: rowNumber, reason: "Missing description" });
      return;
    }
    if (row.amount === undefined || row.amount === "" || Number.isNaN(amount) || amount === 0) {
      errors.push({ row: rowNumber, reason: "Invalid or missing amount" });
      return;
    }

    valid.push({
      transaction_date: row.transaction_date,
      description,
      amount
    });
  });

  return { valid, errors };
};

module.exports = {
  parseStatement
};
