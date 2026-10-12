const { parse } = require("csv-parse/sync");

const REQUIRED_COLUMNS = ["transaction_date", "description", "amount"];
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
// Limits of the Transactions columns (description VARCHAR(255), amount
// DECIMAL(14,2)). MySQL runs in strict mode, so a value outside them is an
// error on INSERT, and because the upload is one transaction, that single row
// would roll back the whole file. Rejecting such rows here keeps the failure
// to the one bad row.
const MAX_DESCRIPTION_LENGTH = 255;
const MAX_ABS_AMOUNT = 999999999999.99;

// The pattern alone accepts dates like 2026-02-30 or 2026-13-01.
function isRealDate(value) {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return year >= 1000 && date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

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
    if (!isRealDate(row.transaction_date)) {
      errors.push({ row: rowNumber, reason: `transaction_date ${row.transaction_date} is not a real calendar date` });
      return;
    }
    if (!description) {
      errors.push({ row: rowNumber, reason: "Missing description" });
      return;
    }
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      errors.push({ row: rowNumber, reason: `Description is longer than ${MAX_DESCRIPTION_LENGTH} characters` });
      return;
    }
    if (row.amount === undefined || row.amount === "" || Number.isNaN(amount) || amount === 0) {
      errors.push({ row: rowNumber, reason: "Invalid or missing amount" });
      return;
    }
    if (Math.abs(amount) > MAX_ABS_AMOUNT) {
      errors.push({ row: rowNumber, reason: "Amount is too large" });
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
