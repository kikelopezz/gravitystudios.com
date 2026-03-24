require('dotenv').config();
const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               process.env.DB_PORT     || 3306,
  database:           process.env.DB_NAME     || 'kikedev',
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  waitForConnections: true,
  connectionLimit:    10,
});

db.getConnection()
  .then(c => { console.log('✅ MySQL conectado'); c.release(); })
  .catch(e => { console.error('❌ MySQL error:', e.message); process.exit(1); });

module.exports = db;
