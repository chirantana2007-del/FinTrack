const pool = require('../config/db');

exports.getPrediction = async (req, res, next) => {
    try {
        const userId = req.user?.id || 1;

        const [rows] = await pool.query(`
            SELECT 
                c.name as category_name,
                SUM(t.amount) as total_spend,
                DATE_FORMAT(t.transaction_date, '%Y-%m') as month
            FROM Transactions t
            JOIN Accounts a ON t.account_id = a.account_id
            JOIN Categories c ON t.category_id = c.category_id
            WHERE a.user_id = ? AND c.type = 'expense'
            GROUP BY category_name, month
            ORDER BY month DESC
        `, [userId]);

        const dataByCat = {};
        for (const r of rows) {
            if (!dataByCat[r.category_name]) {
                dataByCat[r.category_name] = { months: {} };
            }
            const dateObj = new Date(r.month + '-01');
            const monthStr = dateObj.toLocaleString('en-US', { month: 'short' });
            dataByCat[r.category_name].months[monthStr] = r.total_spend;
        }

        const predictions = {};
        const cats = Object.keys(dataByCat).sort((a,b) => {
             const sumA = Object.values(dataByCat[a].months).reduce((x,y) => x+y, 0);
             const sumB = Object.values(dataByCat[b].months).reduce((x,y) => x+y, 0);
             return sumB - sumA;
        }).slice(0, 3);

        for (const cat of cats) {
            const monthsData = dataByCat[cat].months;
            const vals = Object.values(monthsData);
            const sum = vals.reduce((x,y) => x+y, 0);
            const avg = vals.length > 0 ? sum / vals.length : 0;
            const monthKeys = Object.keys(monthsData);
            let trendStr = '+0.0%';
            if (monthKeys.length >= 2) {
                const m1 = monthsData[monthKeys[0]];
                const m2 = monthsData[monthKeys[1]];
                if (m2 > 0) {
                    const diff = ((m1 - m2) / m2) * 100;
                    trendStr = (diff >= 0 ? '+' : '') + diff.toFixed(1) + '%';
                }
            }
            predictions[cat] = {
                trend: trendStr,
                value: avg,
                months: monthsData
            };
        }

        res.json({ success: true, predictions });
    } catch (err) {
        next(err);
    }
};

exports.getAnomalies = async (req, res, next) => {
    try {
        const userId = req.user?.id || 1;
        const [stats] = await pool.query(`
            SELECT c.category_id, AVG(t.amount) as mean, STDDEV(t.amount) as stddev
            FROM Transactions t
            JOIN Accounts a ON t.account_id = a.account_id
            JOIN Categories c ON t.category_id = c.category_id
            WHERE a.user_id = ? AND c.type = 'expense'
            GROUP BY c.category_id
        `, [userId]);

        const statsMap = {};
        stats.forEach(s => { statsMap[s.category_id] = s; });

        const [rows] = await pool.query(`
            SELECT t.transaction_id as id, m.canonical_name as merchant_name, t.amount, t.transaction_date, c.name as category_name, c.category_id
            FROM Transactions t
            JOIN Accounts a ON t.account_id = a.account_id
            LEFT JOIN Merchants m ON t.merchant_id = m.merchant_id
            LEFT JOIN Categories c ON t.category_id = c.category_id
            WHERE a.user_id = ? AND c.type = 'expense'
            ORDER BY t.transaction_date DESC
            LIMIT 100
        `, [userId]);

        const anomalies = [];
        for (const r of rows) {
            const st = statsMap[r.category_id];
            if (st && st.stddev > 0) {
                const zscore = (r.amount - st.mean) / st.stddev;
                if (zscore > 2) {
                    anomalies.push({
                        id: r.id,
                        merchant: r.merchant_name || 'Unknown',
                        amount: r.amount,
                        date: r.transaction_date,
                        category: r.category_name,
                        reason: `Amount ₹${r.amount} is ${zscore.toFixed(1)} standard deviations above the ${r.category_name} average of ₹${Number(st.mean).toFixed(0)}.`
                    });
                }
            } else if (st && st.mean > 0 && r.amount > st.mean * 3) {
                 anomalies.push({
                        id: r.id,
                        merchant: r.merchant_name || 'Unknown',
                        amount: r.amount,
                        date: r.transaction_date,
                        category: r.category_name,
                        reason: `Amount ₹${r.amount} is over 3x the ${r.category_name} average of ₹${Number(st.mean).toFixed(0)}.`
                 });
            }
            if (anomalies.length >= 5) break;
        }

        res.json({ success: true, anomalies });
    } catch (err) {
        next(err);
    }
};

exports.nlQuery = async (req, res, next) => {
    try {
        const userId = req.user?.id || 1;
        const { query } = req.body;
        if (!query) return res.status(400).json({ success: false, message: 'Query is required' });

        let sql = '';
        let params = [];
        let templateMatch = '';

        const q = query.toLowerCase();
        
        // Synonyms mapping
        let searchCat = '';
        if (q.match(/food|dining|eat|meal|restaurant|grocery|groceries/)) {
            searchCat = 'Food';
        } else if (q.match(/transport|fuel|transit|taxi|car|ride|uber/)) {
            searchCat = 'Transport';
        } else if (q.match(/utilit|bill|electric|water|internet/)) {
            searchCat = 'Utilities';
        } else if (q.match(/rent|house|housing|mortgage/)) {
            searchCat = 'Housing';
        } else if (q.match(/health|medical|doctor|pharmacy/)) {
            searchCat = 'Healthcare';
        }

        if (q.includes('highest') || q.includes('largest') || q.includes('max') || q.includes('most')) {
            // Expenses are negative, so MIN() gives the largest expense
            sql = `SELECT MIN(t.amount) as total, COUNT(*) as count FROM Transactions t JOIN Accounts a ON t.account_id = a.account_id JOIN Categories c ON t.category_id = c.category_id WHERE a.user_id = ? AND c.type = 'expense'`;
            params = [userId];
            templateMatch = 'Maximum Single Expense';
        } else if (searchCat) {
            if (searchCat === 'Food') {
                sql = `SELECT SUM(t.amount) as total, COUNT(*) as count FROM Transactions t JOIN Accounts a ON t.account_id = a.account_id JOIN Categories c ON t.category_id = c.category_id WHERE a.user_id = ? AND c.type = 'expense' AND (c.name LIKE '%Food%' OR c.name LIKE '%Restaurant%' OR c.name LIKE '%Groceries%')`;
                params = [userId];
            } else if (searchCat === 'Transport') {
                sql = `SELECT SUM(t.amount) as total, COUNT(*) as count FROM Transactions t JOIN Accounts a ON t.account_id = a.account_id JOIN Categories c ON t.category_id = c.category_id WHERE a.user_id = ? AND c.type = 'expense' AND (c.name LIKE '%Transport%' OR c.name LIKE '%Fuel%' OR c.name LIKE '%Transit%')`;
                params = [userId];
            } else {
                sql = `SELECT SUM(t.amount) as total, COUNT(*) as count FROM Transactions t JOIN Accounts a ON t.account_id = a.account_id JOIN Categories c ON t.category_id = c.category_id WHERE a.user_id = ? AND c.type = 'expense' AND c.name LIKE ?`;
                params = [userId, `%${searchCat}%`];
            }
            templateMatch = `Category Spend (${searchCat})`;
        } else {
            // Total spend across all expenses
            sql = `SELECT SUM(t.amount) as total, COUNT(*) as count FROM Transactions t JOIN Accounts a ON t.account_id = a.account_id JOIN Categories c ON t.category_id = c.category_id WHERE a.user_id = ? AND c.type = 'expense'`;
            params = [userId];
            templateMatch = 'Total Overall Spend';
        }

        const [rows] = await pool.query(sql, params);
        
        res.json({
            success: true,
            result: {
                totalAmount: rows[0].total || 0,
                count: rows[0].count || 0,
                template: `Template: ${templateMatch}`,
                sql_used: sql
            }
        });
    } catch (err) {
        next(err);
    }
};
