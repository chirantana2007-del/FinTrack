require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'fintrack',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    decimalNumbers: true,
    // Without this, mysql2 returns DATE/DATETIME columns as JS Date objects,
    // and JSON.stringify serializes them via toISOString() — which shifts by
    // the server's UTC offset (IST +5:30 rolls a bare DATE back a full day).
    // Keeping them as the raw 'YYYY-MM-DD'/'YYYY-MM-DD HH:MM:SS' strings MySQL
    // returns avoids that entirely.
    dateStrings: true,
});

module.exports = pool;
