const path = require('path');

// Muat backend/.env (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME)
try {
  process.loadEnvFile(path.join(__dirname, '..', '..', '.env'));
} catch {
  /* .env opsional */
}

let pool = null;

function getPool() {
  if (!pool) {
    const mysql = require('mysql2/promise');
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'kostku_db',
      waitForConnections: true,
      connectionLimit: 5,
    });
  }
  return pool;
}

module.exports = { getPool };
