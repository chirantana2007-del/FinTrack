const DAY_IN_MS = 24 * 60 * 60 * 1000;

const isRoughlyMonthly = (date1, date2) => {
  const differenceInDays = Math.abs(
    (date2 - date1) / DAY_IN_MS
  );

  return differenceInDays >= 25 && differenceInDays <= 35;
};

const detectSubscriptions = (transactions) => {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return [];
  }

  const groups = {};

  for (const transaction of transactions) {
    const merchant = (
      transaction.merchant ||
      transaction.description ||
      "Unknown"
    ).toLowerCase().trim();

    if (!groups[merchant]) {
      groups[merchant] = [];
    }

    groups[merchant].push(transaction);
  }

  const subscriptions = [];

  for (const [merchant, merchantTransactions] of Object.entries(groups)) {
    if (merchantTransactions.length < 2) {
      continue;
    }

    const sorted = [...merchantTransactions].sort(
      (a, b) =>
        new Date(a.transaction_date) -
        new Date(b.transaction_date)
    );

    let recurringPairs = 0;

    for (let i = 1; i < sorted.length; i++) {
      const previous = sorted[i - 1];
      const current = sorted[i];

      const previousAmount = Number(previous.amount);
      const currentAmount = Number(current.amount);

      const amountDifference = Math.abs(
        previousAmount - currentAmount
      );

      const amountMatches =
        amountDifference <= Math.max(previousAmount, currentAmount) * 0.1;

      const dateMatches = isRoughlyMonthly(
        new Date(previous.transaction_date),
        new Date(current.transaction_date)
      );

      if (amountMatches && dateMatches) {
        recurringPairs++;
      }
    }

    if (recurringPairs >= 1) {
      const latest = sorted[sorted.length - 1];

      subscriptions.push({
        merchant: latest.merchant || latest.description,
        amount: Number(latest.amount),
        frequency: "monthly",
        transaction_count: merchantTransactions.length
      });
    }
  }

  return subscriptions;
};

module.exports = {
  detectSubscriptions
};