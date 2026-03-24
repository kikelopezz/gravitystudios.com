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

// Función para verificar la conexión
async function testConnection() {
  try {
    const connection = await db.getConnection();
    console.log('✅ MySQL conectado');
    connection.release();
  } catch (err) {
    console.error('❌ MySQL error:', err.message);
    // No cerramos el proceso automáticamente, pero podrías hacerlo si quieres
    // process.exit(1);
  }
}

// Ejecutar la prueba de conexión al iniciar
testConnection();

module.exports = db;