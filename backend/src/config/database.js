const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
}).promise(); // BẮT BUỘC phải có .promise() ở đây

const checkConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log(`✅ MySQL Connected to: ${process.env.DB_NAME}`);
    connection.release();
  } catch (error) {
    console.error('❌ Kết nối MySQL thất bại:', error.message);
    throw error;
  }
};

// Export cả pool và hàm check
module.exports = { pool, checkConnection };