/**
 * Re-exporta el pool de conexion desde connection.js.
 * Los modulos existentes pueden seguir usando require('./db') sin cambios.
 */
const { pool } = require('./connection');

module.exports = pool;