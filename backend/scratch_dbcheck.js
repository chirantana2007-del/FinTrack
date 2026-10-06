require('dotenv').config();
const pool = require('./src/config/db');
(async () => {
  const q = async (label, sql) => {
    try { const [r] = await pool.query(sql); console.log('\n== ' + label); console.table(r); }
    catch (e) { console.log('\n== ' + label + ' ERROR: ' + e.message); }
  };
  await q('users', 'SELECT user_id, email, role FROM Users');
  await q('accounts', 'SELECT account_id, user_id, account_name FROM Accounts');
  await q('txn by user/month', `SELECT a.user_id, DATE_FORMAT(t.transaction_date,'%Y-%m') m, COUNT(*) n, SUM(t.amount) s
     FROM Transactions t JOIN Accounts a ON a.account_id=t.account_id GROUP BY a.user_id, m ORDER BY a.user_id, m`);
  await q('monthly summary', 'SELECT user_id, period_month, COUNT(*) n, SUM(total_income) inc, SUM(total_expense) exp FROM MonthlySummary GROUP BY user_id, period_month');
  await q('budgets', 'SELECT user_id, period_month, COUNT(*) n, SUM(limit_amount) l FROM Budgets GROUP BY user_id, period_month');
  await q('goals', 'SELECT * FROM Goals');
  await q('subs', 'SELECT user_id, COUNT(*) n FROM Subscriptions GROUP BY user_id');
  await q('uncategorized', 'SELECT COUNT(*) n FROM Transactions WHERE category_id IS NULL');
  await q('db.js', 'SELECT 1');
  process.exit(0);
})();
