const pool = require("../config/db");

const NOISE_PATTERN = /\b(POS|UPI|NEFT|IMPS|RTGS|ATM|REF|TXN)[\s:\-]*[A-Z0-9]*\b/gi;
const TRAILING_NUMBER_PATTERN = /\b\d{4,}\b/g;

function normalizeMerchantName(description) {
  if (!description) {
    return "";
  }

  return description
    .toUpperCase()
    .replace(NOISE_PATTERN, " ")
    .replace(TRAILING_NUMBER_PATTERN, " ")
    .replace(/[^A-Z0-9&.\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshteinDistance(a, b) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dist = Array.from({ length: rows }, (_, i) => [i, ...Array(cols - 1).fill(0)]);
  for (let j = 0; j < cols; j += 1) dist[0][j] = j;

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dist[i][j] = Math.min(
        dist[i - 1][j] + 1,
        dist[i][j - 1] + 1,
        dist[i - 1][j - 1] + cost
      );
    }
  }

  return dist[rows - 1][cols - 1];
}

// Exact match on canonical_name -> fuzzy match (Levenshtein <= 2) -> insert new.
const resolveMerchant = async (description, conn = pool) => {
  const canonicalName = normalizeMerchantName(description);
  if (!canonicalName) {
    return null;
  }

  const [exactMatches] = await conn.execute(
    "SELECT merchant_id, canonical_name, default_category_id FROM Merchants WHERE canonical_name = ? LIMIT 1",
    [canonicalName]
  );
  if (exactMatches.length > 0) {
    return exactMatches[0];
  }

  const [allMerchants] = await conn.query(
    "SELECT merchant_id, canonical_name, default_category_id FROM Merchants"
  );
  const fuzzyMatch = allMerchants.find(
    (merchant) => levenshteinDistance(canonicalName, merchant.canonical_name) <= 2
  );
  if (fuzzyMatch) {
    return fuzzyMatch;
  }

  const [result] = await conn.execute(
    "INSERT INTO Merchants (canonical_name) VALUES (?)",
    [canonicalName]
  );
  return { merchant_id: result.insertId, canonical_name: canonicalName, default_category_id: null };
};

const resolveMerchants = async (transactions, conn = pool) => {
  const results = [];
  for (const transaction of transactions) {
    const merchant = await resolveMerchant(transaction.description, conn);
    results.push({ ...transaction, merchant });
  }
  return results;
};

module.exports = {
  resolveMerchant,
  resolveMerchants,
  normalizeMerchantName,
  levenshteinDistance
};
