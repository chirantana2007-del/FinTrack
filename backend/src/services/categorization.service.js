const pool = require("../config/db");

function matchesRule(normalizedDescription, rule) {
  const pattern = (rule.pattern || "").toLowerCase();

  switch (rule.match_type) {
    case "contains":
      return normalizedDescription.includes(pattern);
    case "starts_with":
      return normalizedDescription.startsWith(pattern);
    case "exact":
      return normalizedDescription === pattern;
    case "regex":
      try {
        return new RegExp(rule.pattern, "i").test(normalizedDescription);
      } catch (err) {
        return false;
      }
    default:
      return false;
  }
}

// Category resolution order: the user's own CategoryRules (by priority) first,
// then the global fn_categorize_transaction() DB function as a fallback, then
// Uncategorized (categoryId: null, needsReview: true).
const categorizeTransaction = async (description, userId, conn = pool) => {
  const normalized = (description || "").toLowerCase().trim();

  if (!normalized) {
    return { categoryId: null, needsReview: true };
  }

  const [userRules] = await conn.execute(
    `SELECT category_id, match_type, pattern
     FROM CategoryRules
     WHERE user_id = ? AND is_active = 1
     ORDER BY priority ASC`,
    [userId]
  );

  const matchedUserRule = userRules.find((rule) => matchesRule(normalized, rule));
  if (matchedUserRule) {
    return { categoryId: matchedUserRule.category_id, needsReview: false };
  }

  const [[fallback]] = await conn.query(
    "SELECT fn_categorize_transaction(?) AS category_id",
    [description]
  );

  if (fallback && fallback.category_id) {
    return { categoryId: fallback.category_id, needsReview: false };
  }

  return { categoryId: null, needsReview: true };
};

const categorizeTransactions = async (transactions, userId, conn = pool) => {
  const results = [];
  for (const transaction of transactions) {
    const { categoryId, needsReview } = await categorizeTransaction(
      transaction.description,
      userId,
      conn
    );
    results.push({ ...transaction, categoryId, needsReview });
  }
  return results;
};

module.exports = {
  categorizeTransaction,
  categorizeTransactions
};
