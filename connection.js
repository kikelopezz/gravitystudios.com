require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:     process.env.MYSQLHOST     || 'mysql://root:QHNicTgIkdYKsrzSveirfeAmrYELHsQD@centerbeam.proxy.rlwy.net:46264/railway',
  port:     process.env.MYSQLPORT     || 3306,
  database: process.env.MYSQLDATABASE || 'railway',
  user:     process.env.MYSQLUSER     || 'root',
  password: process.env.MYSQLPASSWORD || 'QHNicTgIkdYKsrzSveirfeAmrYELHsQD',
  waitForConnections: true,
  connectionLimit: 10,
});

/**
 * Verifica la conexion a MySQL.
 * Llama a esta funcion al iniciar el servidor para confirmar que la base de datos esta disponible.
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('MySQL conectado correctamente');
    connection.release();
  } catch (err) {
    console.error('Error al conectar MySQL:', err.message);
  }
}

module.exports = { pool, testConnection };
