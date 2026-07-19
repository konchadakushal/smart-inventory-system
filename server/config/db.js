import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Create the connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'smart_inventory',
  port: parseInt(process.env.DB_PORT || '3306', 10),

  // ssl: {
  //   rejectUnauthorized: false
  // },

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test the database connection and log status
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('Database connected successfully to database:', process.env.DB_NAME || 'smart_inventory');
    connection.release();
  } catch (error) {
    console.error('Database connection failed!');
    console.error(error.message);
    // Do not crash the server immediately, but log the error
  }
};

testConnection();

export default pool;
