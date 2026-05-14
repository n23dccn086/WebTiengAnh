const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "vocab_learning",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Hàm kiểm tra kết nối
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Đã kết nối thành công đến MySQL database!");
    console.log(`   Database: ${process.env.DB_NAME || "vocab_learning"}`);
    console.log(`   Host: ${process.env.DB_HOST || "localhost"}`);
    connection.release();
    return true;
  } catch (error) {
    console.error("❌ Kết nối MySQL thất bại!");
    console.error(`   Lỗi: ${error.message}`);
    return false;
  }
}

// Tự động test kết nối khi file được require
testConnection();

module.exports = pool;
