const pool = require("../config/db");

// Detection rules (IMPLEMENTATION_PLAN, "Subscription detection"):
//   - group expense transactions by merchant
//   - >= 3 occurrences
//   - each amount within ±5% of the most recent charge
//   - each gap within ±3 days of a weekly or monthly cadence
const MIN_OCCURRENCES = 3;
const AMOUNT_TOLERANCE = 0.05;
const DAY_TOLERANCE = 3;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

// Monthly is tried first so a monthly charge is never misreported as weekly.
const CADENCES = ["monthly", "weekly"];

// Dates are handled as UTC midnight so day arithmetic never drifts with the
// server's timezone (pool uses dateStrings, so inputs are 'YYYY-MM-DD').
function parseDate(value) {
  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

// Calendar-aware step: Jan 31 + 1 month clamps to Feb 28/29 instead of
// spilling into March.
function addInterval(date, cadence, steps = 1) {
  if (cadence === "weekly") {
    return new Date(date.getTime() + 7 * steps * DAY_IN_MS);
  }
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + steps;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, month, Math.min(date.getUTCDate(), lastDay)));
}

function daysBetween(a, b) {
  return Math.round((a - b) / DAY_IN_MS);
}

function amountMatches(amount, reference) {
  return Math.abs(amount - reference) <= reference * AMOUNT_TOLERANCE;
}

// Walks backwards from the most recent charge, collecting earlier charges that
// land one cadence step (±3 days) before the previous link and match its
// amount. Unrelated purchases from the same merchant are skipped rather than
// breaking the chain. Returns the chain oldest-first.
function findChain(sortedDesc, cadence) {
  const latest = sortedDesc[0];
  const chain = [latest];

  for (let i = 1; i < sortedDesc.length; i += 1) {
    const candidate = sortedDesc[i];
    const earliest = chain[chain.length - 1];
    const expected = addInterval(earliest.date, cadence, -1);
    const offset = daysBetween(candidate.date, expected);

    if (offset < -DAY_TOLERANCE) {
      break; // everything further back is even earlier
    }
    if (Math.abs(offset) <= DAY_TOLERANCE && amountMatches(candidate.amount, latest.amount)) {
      chain.push(candidate);
    }
  }

  return chain.reverse();
}

const detectSubscriptions = (transactions) => {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return [];
  }

  const groups = new Map();

  for (const transaction of transactions) {
    const amount = Math.abs(Number(transaction.amount));
    if (!transaction.transaction_date || !amount) {
      continue;
    }

    const merchantName = transaction.merchant || transaction.description || "Unknown";
    const key = transaction.merchant_id ?? merchantName.toLowerCase().trim();

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push({ ...transaction, merchantName, amount, date: parseDate(transaction.transaction_date) });
  }

  const subscriptions = [];

  for (const group of groups.values()) {
    if (group.length < MIN_OCCURRENCES) {
      continue;
    }

    const sortedDesc = [...group].sort((a, b) => b.date - a.date);

    for (const cadence of CADENCES) {
      const chain = findChain(sortedDesc, cadence);
      if (chain.length < MIN_OCCURRENCES) {
        continue;
      }

      const latest = chain[chain.length - 1];
      subscriptions.push({
        merchant_id: latest.merchant_id ?? null,
        merchant: latest.merchantName,
        category_id: latest.category_id ?? null,
        amount: latest.amount,
        cadence,
        last_charged_date: formatDate(latest.date),
        next_due_date: formatDate(addInterval(latest.date, cadence)),
        occurrences: chain.length,
        transaction_ids: chain.map((t) => t.transaction_id).filter((id) => id !== undefined)
      });
      break;
    }
  }

  return subscriptions;
};

// Re-runs detection over all of a user's expense history and upserts the
// results into Subscriptions (one row per user + merchant). Also flags the
// matched transactions as recurring. Safe to call repeatedly.
const syncSubscriptions = async (userId, conn = pool) => {
  const [transactions] = await conn.execute(
    `SELECT t.transaction_id, t.merchant_id, m.canonical_name AS merchant, t.category_id,
            t.transaction_date, t.amount
     FROM Transactions t
     JOIN Accounts a ON a.account_id = t.account_id
     JOIN Merchants m ON m.merchant_id = t.merchant_id
     WHERE a.user_id = ? AND t.amount < 0
     ORDER BY t.merchant_id, t.transaction_date`,
    [userId]
  );

  const detected = detectSubscriptions(transactions);

  for (const subscription of detected) {
    const [existing] = await conn.execute(
      "SELECT subscription_id FROM Subscriptions WHERE user_id = ? AND merchant_id = ? LIMIT 1",
      [userId, subscription.merchant_id]
    );

    if (existing.length > 0) {
      subscription.subscription_id = existing[0].subscription_id;
      await conn.execute(
        `UPDATE Subscriptions
         SET category_id = ?, amount = ?, cadence = ?, last_charged_date = ?, next_due_date = ?
         WHERE subscription_id = ?`,
        [
          subscription.category_id,
          subscription.amount,
          subscription.cadence,
          subscription.last_charged_date,
          subscription.next_due_date,
          subscription.subscription_id
        ]
      );
    } else {
      const [result] = await conn.execute(
        `INSERT INTO Subscriptions
           (user_id, merchant_id, category_id, amount, cadence, last_charged_date, next_due_date)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          subscription.merchant_id,
          subscription.category_id,
          subscription.amount,
          subscription.cadence,
          subscription.last_charged_date,
          subscription.next_due_date
        ]
      );
      subscription.subscription_id = result.insertId;
    }

    if (subscription.transaction_ids.length > 0) {
      const placeholders = subscription.transaction_ids.map(() => "?").join(", ");
      await conn.execute(
        `UPDATE Transactions SET is_recurring = 1 WHERE transaction_id IN (${placeholders})`,
        subscription.transaction_ids
      );
    }
  }

  return detected;
};

module.exports = {
  detectSubscriptions,
  syncSubscriptions,
  addInterval
};
