require('dotenv').config(); // Solo para desarrollo local
const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host:     process.env.MYSQLHOST || 'mysql://root:QHNicTgIkdYKsrzSveirfeAmrYELHsQD@centerbeam.proxy.rlwy.net:46264/railway', // Host real
  port:     process.env.MYSQLPORT || 3306,
  database: process.env.MYSQLDATABASE || 'railway',
  user:     process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || 'QHNicTgIkdYKsrzSveirfeAmrYELHsQD',
  waitForConnections: true,
  connectionLimit: 10,
});

// Función para verificar conexión
async function testConnection() {
  try {
    const connection = await db.getConnection();
    console.log('✅ MySQL conectado correctamente');
    connection.release();
  } catch (err) {
    console.error('❌ Error al conectar MySQL:', err.message);
  }
}

testConnection();

module.exports = db;