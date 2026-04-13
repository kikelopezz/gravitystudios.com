require('dotenv').config(); // Solo para desarrollo local
const mysql = require('mysql2/promise');

// All database credentials MUST come from environment variables.
// See .env.example for the required variables.
const requiredEnvVars = ['MYSQLHOST', 'MYSQLDATABASE', 'MYSQLUSER', 'MYSQLPASSWORD'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required environment variable: ${envVar}`);
    console.error('   Please set all database variables in your .env file. See .env.example.');
    process.exit(1);
  }
}

const db = mysql.createPool({
  host:     process.env.MYSQLHOST,
  port:     parseInt(process.env.MYSQLPORT, 10) || 3306,
  database: process.env.MYSQLDATABASE,
  user:     process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
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