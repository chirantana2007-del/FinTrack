require('dotenv').config();
const app = require('./app');
const pool = require('./config/db');

const PORT = process.env.PORT || 4000;

async function start() {
    try {
        const conn = await pool.getConnection();
        conn.release();
        console.log('Database connection OK');
    } catch (err) {
        console.warn('Could not connect to the database at startup:', err.message);
    }

    app.listen(PORT, () => {
        console.log(`FinTrack backend listening on port ${PORT}`);
    });
}

start();
