const express = require('express');
const cors = require('cors');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/upload', require('./routes/upload.routes'));
app.use('/api/accounts', require('./routes/accounts.routes'));
app.use('/api/categories', require('./routes/categories.routes'));
app.use('/api/budgets', require('./routes/budgets.routes'));
app.use('/api/transactions', require('./routes/transactions.routes'));
app.use('/api/insights', require('./routes/insights.routes'));
app.use('/api/analytics', require('./routes/analytics.routes'));
app.use('/api/reports', require('./routes/reports.routes'));
app.use('/api/goals', require('./routes/goals.routes'));
app.use('/api/subscriptions', require('./routes/subscriptions.routes'));
app.use('/api/notifications', require('./routes/notifications.routes'));

// Remaining feature routes are mounted here as each one is implemented.
// See IMPLEMENTATION_PLAN.md section 6 for the full task list.

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
