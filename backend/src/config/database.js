const mysql = require("mysql2");
require("dotenv").config();

const pool = mysql
  .createPool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "edtech_db",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  })
  .promise();

const checkConnection = async () => {
  try {
    const connection = await pool.getConnection();

    console.log("✅ MySQL Connected successfully!");
    console.log(`   Host: ${process.env.DB_HOST || "localhost"}`);
    console.log(`   Port: ${process.env.DB_PORT || 3306}`);
    console.log(`   Database: ${process.env.DB_NAME || "edtech_db"}`);

    connection.release();
  } catch (error) {
    console.error("❌ Kết nối MySQL thất bại:", error.message);
    throw error;
  }
};

// Cách export này hỗ trợ cả 2 kiểu import:
// 1. const db = require("../config/database");
// 2. const { pool, checkConnection } = require("../config/database");
module.exports = pool;
module.exports.pool = pool;
module.exports.checkConnection = checkConnection;
