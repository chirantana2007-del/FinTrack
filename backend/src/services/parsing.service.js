const { parse } = require("csv-parse/sync");

const parseStatement = (csvData) => {
  if (!csvData) {
    throw new Error("CSV data is required");
  }

  const records = parse(csvData, {
    columns: true,
    skip_empty_lines: true,
    trim: true
  });

  return records.map((row) => ({
    transaction_date: row.transaction_date,
    description: row.description,
    amount: Number(row.amount)
  }));
};

module.exports = {
  parseStatement
};