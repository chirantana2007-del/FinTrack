const { format } = require("mysql2");
const pool = require("../config/db");

// Plain-English questions -> one of a few fixed, parameterized SQL templates.
// Nothing from the question is ever put into the SQL text: it only chooses
// which template, category patterns and date range to use, and the values go
// in as bound parameters.
//
// "Spent" means debits only (amount < 0), summed as -amount, which is the same
// definition the Dashboard uses.

// Specific categories come before the broad ones that contain them, so
// "groceries" answers with Groceries, not all of Food & Dining.
const CATEGORY_GROUPS = [
  { label: "Groceries", words: /\b(groceries|grocery)\b/, patterns: ["%Groceries%"] },
  { label: "Restaurants", words: /\b(restaurants?|swiggy|zomato|takeaway)\b/, patterns: ["%Restaurants%"] },
  { label: "Food & dining", words: /\b(food|dining|dine|eat|eating|meals?)\b/, patterns: ["%Food%", "%Restaurant%", "%Groceries%"] },
  { label: "Fuel", words: /\b(fuel|petrol|diesel)\b/, patterns: ["%Fuel%"] },
  { label: "Public transit", words: /\b(transit|metro|bus|uber|ola|cab|taxi|rides?)\b/, patterns: ["%Transit%"] },
  { label: "Transport", words: /\b(transport|transportation|car)\b/, patterns: ["%Transport%", "%Fuel%", "%Transit%"] },
  { label: "Utilities", words: /\b(utilit(?:y|ies)|bills?|electric(?:ity)?|water|internet|broadband)\b/, patterns: ["%Utilit%"] },
  { label: "Housing", words: /\b(rent|house|housing|mortgage)\b/, patterns: ["%Housing%"] },
  { label: "Healthcare", words: /\b(health|healthcare|medical|doctor|pharmacy|medicine)\b/, patterns: ["%Healthcare%"] },
  { label: "Shopping", words: /\b(shopping|shop|clothes|clothing)\b/, patterns: ["%Shopping%"] },
  { label: "Entertainment", words: /\b(entertainment|movies?|cinema|games?|gaming|concerts?)\b/, patterns: ["%Entertainment%"] },
  { label: "Subscriptions", words: /\b(subscriptions?|netflix|spotify)\b/, patterns: ["%Subscription%"] },
  { label: "Miscellaneous", words: /\b(miscellaneous|misc)\b/, patterns: ["%Miscellaneous%"] }
];

const MAX_WORDS = /\b(highest|largest|biggest|maximum|max|most expensive|costliest)\b/;
const TOTAL_WORDS = /\b(total|overall|altogether|everything|all)\b/;

const MONTH_NAMES = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december"
];
const MONTH_TOKEN =
  /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b(?:\s+(20\d{2}))?/;

const pad = (n) => String(n).padStart(2, "0");

// Month as { start, end (exclusive), label } from a year and a 1-12 month.
function monthPeriod(year, month) {
  const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  const name = MONTH_NAMES[month - 1];
  return {
    start: `${year}-${pad(month)}-01`,
    end: `${next.year}-${pad(next.month)}-01`,
    label: `${name[0].toUpperCase()}${name.slice(1)} ${year}`
  };
}

function resolvePeriod(q, now) {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  if (/\blast month\b/.test(q)) {
    return month === 1 ? monthPeriod(year - 1, 12) : monthPeriod(year, month - 1);
  }
  if (/\b(this month|current month)\b/.test(q)) {
    return monthPeriod(year, month);
  }

  const match = MONTH_TOKEN.exec(q);
  if (!match) return null;
  const [, token, explicitYear] = match;
  const monthNumber = MONTH_NAMES.findIndex((name) => name.startsWith(token.slice(0, 3))) + 1;

  // "may" is also an ordinary word ("may I ask"), so only trust it when the
  // phrasing makes it a month.
  if (monthNumber === 5 && token === "may" && !explicitYear && !/\b(in|for|during|of)\s+may\b/.test(q)) {
    return null;
  }

  if (explicitYear) return monthPeriod(Number(explicitYear), monthNumber);
  // No year given: the most recent such month that isn't in the future.
  return monthPeriod(monthNumber <= month ? year : year - 1, monthNumber);
}

function interpretQuestion(question, now = new Date()) {
  const q = String(question || "").toLowerCase();
  const kind = MAX_WORDS.test(q) ? "max" : "spend";
  const group = CATEGORY_GROUPS.find((g) => g.words.test(q)) || null;
  const period = resolvePeriod(q, now);
  const when = period ? period.label : "all time";

  let interpretation;
  let template;
  if (kind === "max") {
    interpretation = `Largest single expense${group ? ` in ${group.label}` : ""}, ${when}`;
    template = "Maximum Single Expense";
  } else if (group) {
    interpretation = `${group.label} spending, ${when}`;
    template = `Category Spend (${group.label})`;
  } else {
    // Say so when no category was understood, rather than quietly answering a
    // different question than the one asked.
    interpretation = `Total spending, ${when}${TOTAL_WORDS.test(q) ? "" : " (no category recognised in your question)"}`;
    template = "Total Overall Spend";
  }

  return {
    kind,
    categoryLabel: group ? group.label : null,
    categoryPatterns: group ? group.patterns : null,
    period,
    interpretation,
    template
  };
}

function buildQuery(intent, userId) {
  const where = ["a.user_id = ?", "t.amount < 0"];
  const params = [userId];
  let join = "";

  if (intent.categoryPatterns) {
    join = "JOIN Categories c ON c.category_id = t.category_id";
    where.push("c.type = 'expense'");
    where.push(`(${intent.categoryPatterns.map(() => "c.name LIKE ?").join(" OR ")})`);
    params.push(...intent.categoryPatterns);
  }
  if (intent.period) {
    where.push("t.transaction_date >= ? AND t.transaction_date < ?");
    params.push(intent.period.start, intent.period.end);
  }

  const from = `FROM Transactions t JOIN Accounts a ON a.account_id = t.account_id ${join} WHERE ${where.join(" AND ")}`;
  const sql =
    intent.kind === "max"
      ? `SELECT -t.amount AS total, 1 AS count, t.description, t.transaction_date ${from} ORDER BY t.amount ASC, t.transaction_date DESC LIMIT 1`
      : `SELECT COALESCE(SUM(-t.amount), 0) AS total, COUNT(*) AS count ${from}`;

  return { sql: sql.replace(/\s+/g, " "), params };
}

async function answerQuestion(question, userId, conn = pool, now = new Date()) {
  const intent = interpretQuestion(question, now);
  const { sql, params } = buildQuery(intent, userId);
  const [rows] = await conn.query(sql, params);
  const row = rows[0] || {};

  let interpretation = intent.interpretation;
  if (intent.kind === "max" && row.description) {
    interpretation += `: ${row.description} on ${String(row.transaction_date).slice(0, 10)}`;
  }

  return {
    totalAmount: Number(row.total) || 0,
    count: Number(row.count) || 0,
    template: `Template: ${intent.template}`,
    interpretation,
    period: intent.period ? intent.period.label : null,
    // The query with its values filled in, for display only.
    sql_used: format(sql, params)
  };
}

module.exports = { interpretQuestion, buildQuery, answerQuestion };
