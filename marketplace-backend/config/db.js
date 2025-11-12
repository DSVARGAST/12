// config/db.js
require('dotenv').config();
const mysql = require('mysql2/promise');

async function connectDB() {
  const pool = await mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
  });
  await pool.query('SELECT 1'); // prueba
  console.log('MySQL pool OK');
  return pool;
}

module.exports = connectDB;
