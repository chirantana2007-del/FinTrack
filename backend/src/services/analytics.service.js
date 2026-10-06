const pool = require("../config/db");
const { detectSubscriptions } = require("./subscription.service");

// ---------------------------------------------------------------------------
// Month helpers. Months are always handled as 'YYYY-MM-01' strings (the same
// shape MonthlySummary.period_month / Budgets.period_month use, and what
// mysql2 returns with dateStrings: true) so no timezone shifting can occur.
// ---------------------------------------------------------------------------
const MONTH_PATTERN = /^\d{4}-\d{2}(-\d{2})?$/;
const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const LONG_MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

function toMonthStart(value) {
    if (typeof value !== "string" || !MONTH_PATTERN.test(value)) {
        return null;
    }
    const [year, month] = value.split("-").map(Number);
    if (month < 1 || month > 12) {
        return null;
    }
    return `${year}-${String(month).padStart(2, "0")}-01`;
}

function addMonths(monthStart, delta) {
    const [year, month] = monthStart.split("-").map(Number);
    const index = year * 12 + (month - 1) + delta;
    const newYear = Math.floor(index / 12);
    const newMonth = (index % 12) + 1;
    return `${newYear}-${String(newMonth).padStart(2, "0")}-01`;
}

function daysInMonth(monthStart) {
    const [year, month] = monthStart.split("-").map(Number);
    return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function monthLabel(monthStart, long = false) {
    const [year, month] = monthStart.split("-").map(Number);
    return `${(long ? LONG_MONTHS : SHORT_MONTHS)[month - 1]} ${year}`;
}

function currentMonthStart(now = new Date()) {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

function round2(value) {
    return Math.round((Number(value) || 0) * 100) / 100;
}

function pctChange(current, previous) {
    if (!previous) {
        return null;
    }
    return round2(((current - previous) / previous) * 100);
}

function addOneMonthToDate(dateString) {
    const [year, month, day] = dateString.slice(0, 10).split("-").map(Number);
    const target = new Date(Date.UTC(year, month, 1));
    const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
    target.setUTCDate(Math.min(day, lastDay));
    return target.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Period resolution
// ---------------------------------------------------------------------------
async function getAvailableMonths(userId) {
    const [rows] = await pool.query(
        `SELECT DISTINCT DATE_FORMAT(t.transaction_date, '%Y-%m-01') AS month
         FROM Transactions t
         JOIN Accounts a ON a.account_id = t.account_id
         WHERE a.user_id = ?
         ORDER BY month DESC`,
        [userId]
    );
    return rows.map((r) => r.month);
}

// Explicit ?month wins. Otherwise: the current month if it has data (live
// "month to date" view), else the most recent month that has data. With
// preferComplete (used by the monthly statement), the most recent month
// strictly before the current one is preferred — a statement for a month
// that has only just started is not useful.
async function resolvePeriod(userId, requestedMonth, { preferComplete = false, now = new Date() } = {}) {
    const availableMonths = await getAvailableMonths(userId);
    const explicit = toMonthStart(requestedMonth);
    const current = currentMonthStart(now);

    let month;
    if (explicit) {
        month = explicit;
    } else if (availableMonths.length === 0) {
        month = current;
    } else if (preferComplete) {
        month = availableMonths.find((m) => m < current) || availableMonths[0];
    } else {
        month = availableMonths.includes(current) ? current : availableMonths[0];
    }

    return { month, availableMonths };
}

// ---------------------------------------------------------------------------
// Overview — everything the Dashboard, the Report page and the PDF export
// need for one user/month, read from MonthlySummary (+ Transactions for the
// line-item views). Kept in one place so all three always agree.
// ---------------------------------------------------------------------------
async function getMonthlyOverview(userId, month, { availableMonths = [], now = new Date() } = {}) {
    const previousMonth = addMonths(month, -1);
    const trendStart = addMonths(month, -5);
    const nextMonth = addMonths(month, 1);
    const totalDays = daysInMonth(month);
    const isCurrent = month === currentMonthStart(now);

    // MonthlySummary is only ever written by the DB (trigger / procedure).
    // Re-running the procedure for the month being viewed guarantees the
    // figures are a full, consistent recompute (idempotent by design).
    await pool.query("CALL sp_generate_monthly_summary(?, ?)", [userId, month]);

    const [[user]] = await pool.query(
        "SELECT user_id, full_name, email FROM Users WHERE user_id = ?",
        [userId]
    );

    const [categoryRows] = await pool.query(
        `SELECT ms.period_month, ms.category_id, COALESCE(c.name, 'Uncategorized') AS name,
                ms.total_income, ms.total_expense
         FROM MonthlySummary ms
         LEFT JOIN Categories c ON c.category_id = ms.category_id
         WHERE ms.user_id = ? AND ms.period_month IN (?, ?)`,
        [userId, month, previousMonth]
    );

    const [trendRows] = await pool.query(
        `SELECT period_month, SUM(total_income) AS income, SUM(total_expense) AS expense
         FROM MonthlySummary
         WHERE user_id = ? AND period_month BETWEEN ? AND ?
         GROUP BY period_month`,
        [userId, trendStart, month]
    );

    const [budgetRows] = await pool.query(
        `SELECT b.budget_id, b.category_id, c.name AS category_name, b.limit_amount,
                COALESCE(ms.total_expense, 0) AS spent
         FROM Budgets b
         JOIN Categories c ON c.category_id = b.category_id
         LEFT JOIN MonthlySummary ms
           ON ms.user_id = b.user_id AND ms.category_id = b.category_id AND ms.period_month = b.period_month
         WHERE b.user_id = ? AND b.period_month = ?
         ORDER BY c.name`,
        [userId, month]
    );

    const [recentRows] = await pool.query(
        `SELECT t.transaction_id, t.transaction_date, t.description, t.amount, t.needs_review,
                t.is_flagged_anomaly, COALESCE(c.name, 'Uncategorized') AS category_name,
                m.canonical_name AS merchant_name
         FROM Transactions t
         JOIN Accounts a ON a.account_id = t.account_id
         LEFT JOIN Categories c ON c.category_id = t.category_id
         LEFT JOIN Merchants m ON m.merchant_id = t.merchant_id
         WHERE a.user_id = ? AND t.transaction_date >= ? AND t.transaction_date < ?
         ORDER BY t.transaction_date DESC, t.transaction_id DESC
         LIMIT 8`,
        [userId, month, nextMonth]
    );

    const [merchantRows] = await pool.query(
        `SELECT COALESCE(m.canonical_name, t.description) AS name,
                SUM(-t.amount) AS total, COUNT(*) AS count
         FROM Transactions t
         JOIN Accounts a ON a.account_id = t.account_id
         LEFT JOIN Merchants m ON m.merchant_id = t.merchant_id
         WHERE a.user_id = ? AND t.amount < 0
           AND t.transaction_date >= ? AND t.transaction_date < ?
         GROUP BY name
         ORDER BY total DESC
         LIMIT 5`,
        [userId, month, nextMonth]
    );

    const [dailyRows] = await pool.query(
        `SELECT t.transaction_date AS date,
                SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END) AS income,
                SUM(CASE WHEN t.amount < 0 THEN -t.amount ELSE 0 END) AS expense
         FROM Transactions t
         JOIN Accounts a ON a.account_id = t.account_id
         WHERE a.user_id = ? AND t.transaction_date >= ? AND t.transaction_date < ?
         GROUP BY t.transaction_date
         ORDER BY t.transaction_date`,
        [userId, month, nextMonth]
    );

    const [[counts]] = await pool.query(
        `SELECT COUNT(*) AS total,
                COALESCE(SUM(t.needs_review), 0) AS needs_review,
                COALESCE(SUM(t.is_flagged_anomaly), 0) AS anomalies
         FROM Transactions t
         JOIN Accounts a ON a.account_id = t.account_id
         WHERE a.user_id = ? AND t.transaction_date >= ? AND t.transaction_date < ?`,
        [userId, month, nextMonth]
    );

    // --- Totals + category breakdown -------------------------------------
    let income = 0;
    let expense = 0;
    let previousIncome = 0;
    let previousExpense = 0;
    const previousByCategory = new Map();
    const currentByCategory = new Map();

    for (const row of categoryRows) {
        const key = row.category_id === null ? "null" : String(row.category_id);
        const rowIncome = Number(row.total_income) || 0;
        const rowExpense = Number(row.total_expense) || 0;
        if (row.period_month.slice(0, 10) === month) {
            income += rowIncome;
            expense += rowExpense;
            if (rowExpense > 0) {
                currentByCategory.set(key, { categoryId: row.category_id, name: row.name, amount: rowExpense });
            }
        } else {
            previousIncome += rowIncome;
            previousExpense += rowExpense;
            previousByCategory.set(key, rowExpense);
        }
    }

    const categories = [...currentByCategory.entries()]
        .map(([key, c]) => {
            const prevAmount = previousByCategory.get(key) || 0;
            return {
                categoryId: c.categoryId,
                name: c.name,
                amount: round2(c.amount),
                prevAmount: round2(prevAmount),
                share: expense ? round2((c.amount / expense) * 100) : 0,
                changePct: pctChange(c.amount, prevAmount)
            };
        })
        .sort((a, b) => b.amount - a.amount);

    // Categories that had spend last month but none this month still matter
    // for a month-over-month comparison.
    const droppedCategories = categoryRows
        .filter((r) => r.period_month.slice(0, 10) === previousMonth && Number(r.total_expense) > 0)
        .filter((r) => !currentByCategory.has(r.category_id === null ? "null" : String(r.category_id)))
        .map((r) => ({ categoryId: r.category_id, name: r.name, amount: 0, prevAmount: round2(r.total_expense), share: 0, changePct: -100 }));

    // --- 6-month trend ----------------------------------------------------
    const trendMap = new Map(trendRows.map((r) => [r.period_month.slice(0, 10), r]));
    const trend = [];
    for (let i = 5; i >= 0; i -= 1) {
        const m = addMonths(month, -i);
        const row = trendMap.get(m);
        const mIncome = round2(row ? row.income : 0);
        const mExpense = round2(row ? row.expense : 0);
        trend.push({ month: m, label: SHORT_MONTHS[Number(m.slice(5, 7)) - 1], income: mIncome, expense: mExpense, net: round2(mIncome - mExpense) });
    }

    // --- Budgets ----------------------------------------------------------
    const budgetItems = budgetRows.map((b) => {
        const limit = Number(b.limit_amount) || 0;
        const spent = Number(b.spent) || 0;
        return {
            budgetId: b.budget_id,
            categoryId: b.category_id,
            name: b.category_name,
            limit: round2(limit),
            spent: round2(spent),
            pct: limit ? round2((spent / limit) * 100) : 0
        };
    });
    const totalLimit = budgetItems.reduce((s, b) => s + b.limit, 0);
    const totalBudgetSpent = budgetItems.reduce((s, b) => s + b.spent, 0);

    // --- Recurring payments -------------------------------------------------
    const subscriptions = await getRecurringPayments(userId, trendStart, nextMonth);

    // --- Projection (only meaningful while the month is in progress) -------
    let projectedExpense = null;
    let daysElapsed = totalDays;
    if (isCurrent) {
        daysElapsed = Math.max(1, now.getDate());
        projectedExpense = round2((expense / daysElapsed) * totalDays);
    }

    const net = income - expense;

    return {
        period: {
            month,
            label: monthLabel(month, true),
            shortLabel: monthLabel(month),
            start: month,
            end: `${month.slice(0, 8)}${String(totalDays).padStart(2, "0")}`,
            daysInMonth: totalDays,
            daysElapsed,
            isCurrent,
            previousMonth,
            previousLabel: monthLabel(previousMonth, true)
        },
        availableMonths,
        user: user ? { id: user.user_id, name: user.full_name, email: user.email } : null,
        totals: {
            income: round2(income),
            expense: round2(expense),
            net: round2(net),
            savingsRate: income ? round2((net / income) * 100) : null,
            previousIncome: round2(previousIncome),
            previousExpense: round2(previousExpense),
            expenseChangePct: pctChange(expense, previousExpense),
            incomeChangePct: pctChange(income, previousIncome),
            projectedExpense,
            transactionCount: Number(counts.total) || 0,
            needsReviewCount: Number(counts.needs_review) || 0,
            anomalyCount: Number(counts.anomalies) || 0
        },
        categories,
        droppedCategories,
        trend,
        budgets: {
            items: budgetItems,
            totalLimit: round2(totalLimit),
            totalSpent: round2(totalBudgetSpent),
            pct: totalLimit ? round2((totalBudgetSpent / totalLimit) * 100) : null,
            overCount: budgetItems.filter((b) => b.pct >= 100).length,
            warningCount: budgetItems.filter((b) => b.pct >= 80 && b.pct < 100).length
        },
        recentTransactions: recentRows.map((t) => ({
            id: t.transaction_id,
            date: t.transaction_date,
            description: t.description,
            merchant: t.merchant_name,
            category: t.category_name,
            amount: round2(t.amount),
            needsReview: Boolean(t.needs_review),
            flagged: Boolean(t.is_flagged_anomaly)
        })),
        topMerchants: merchantRows.map((m) => ({ name: m.name, total: round2(m.total), count: Number(m.count) })),
        daily: dailyRows.map((d) => ({ date: d.date, income: round2(d.income), expense: round2(d.expense) })),
        subscriptions
    };
}

// Prefer persisted Subscriptions rows; if none exist yet, fall back to running
// Member 2's detectSubscriptions() over the user's recent debits (read-only).
async function getRecurringPayments(userId, fromMonth, toExclusive) {
    const [persisted] = await pool.query(
        `SELECT m.canonical_name AS merchant, s.amount, s.next_due_date, s.cadence
         FROM Subscriptions s
         JOIN Merchants m ON m.merchant_id = s.merchant_id
         WHERE s.user_id = ? AND s.is_active = 1
         ORDER BY s.next_due_date IS NULL, s.next_due_date`,
        [userId]
    );

    if (persisted.length > 0) {
        const items = persisted.map((s) => ({
            merchant: s.merchant,
            amount: round2(Math.abs(s.amount)),
            nextDue: s.next_due_date,
            cadence: s.cadence
        }));
        return { source: "subscriptions", count: items.length, monthlyTotal: round2(items.reduce((s, i) => s + i.amount, 0)), items };
    }

    const [debits] = await pool.query(
        `SELECT COALESCE(m.canonical_name, t.description) AS merchant, t.amount, t.transaction_date
         FROM Transactions t
         JOIN Accounts a ON a.account_id = t.account_id
         LEFT JOIN Merchants m ON m.merchant_id = t.merchant_id
         WHERE a.user_id = ? AND t.amount < 0
           AND t.transaction_date >= ? AND t.transaction_date < ?`,
        [userId, fromMonth, toExclusive]
    );

    const lastSeen = new Map();
    for (const d of debits) {
        const key = String(d.merchant).toLowerCase().trim();
        const date = String(d.transaction_date).slice(0, 10);
        if (!lastSeen.has(key) || lastSeen.get(key) < date) {
            lastSeen.set(key, date);
        }
    }

    // Anything not charged in the ~45 days before the window end is treated
    // as cancelled rather than still recurring.
    const cutoff = new Date(`${toExclusive}T00:00:00Z`);
    cutoff.setUTCDate(cutoff.getUTCDate() - 45);
    const cutoffString = cutoff.toISOString().slice(0, 10);

    const detected = detectSubscriptions(
        debits.map((d) => ({ merchant: d.merchant, amount: Math.abs(Number(d.amount)), transaction_date: d.transaction_date }))
    )
        .map((s) => {
            const last = lastSeen.get(String(s.merchant).toLowerCase().trim());
            return {
                merchant: s.merchant,
                amount: round2(s.amount),
                lastCharged: last,
                nextDue: last ? addOneMonthToDate(last) : null,
                cadence: s.frequency
            };
        })
        .filter((s) => s.lastCharged && s.lastCharged >= cutoffString)
        .sort((a, b) => String(a.nextDue).localeCompare(String(b.nextDue)));

    return {
        source: "detected",
        count: detected.length,
        monthlyTotal: round2(detected.reduce((s, i) => s + i.amount, 0)),
        items: detected
    };
}

module.exports = {
    toMonthStart,
    addMonths,
    daysInMonth,
    monthLabel,
    currentMonthStart,
    getAvailableMonths,
    resolvePeriod,
    getMonthlyOverview,
    getRecurringPayments
};
