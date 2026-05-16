const mysql = require("mysql2");
require("dotenv").config();

const rawPool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "edtech_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Wrapper query dùng Promise, KHÔNG dùng rawPool.promise()
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    rawPool.query(sql, params, (error, results, fields) => {
      if (error) {
        reject(error);
        return;
      }

      resolve([results, fields]);
    });
  });
}

// Wrapper execute dùng Promise, KHÔNG dùng rawPool.promise()
function execute(sql, params = []) {
  return new Promise((resolve, reject) => {
    rawPool.execute(sql, params, (error, results, fields) => {
      if (error) {
        reject(error);
        return;
      }

      resolve([results, fields]);
    });
  });
}

// Nếu chỗ nào cần getConnection thì vẫn hỗ trợ
function getConnection() {
  return new Promise((resolve, reject) => {
    rawPool.getConnection((error, connection) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(connection);
    });
  });
}

async function checkConnection() {
  try {
    await query("SELECT 1");

    console.log("✅ MySQL Connected successfully!");
    console.log(`   Host: ${process.env.DB_HOST || "localhost"}`);
    console.log(`   Port: ${process.env.DB_PORT || 3306}`);
    console.log(`   Database: ${process.env.DB_NAME || "edtech_db"}`);
  } catch (error) {
    console.error("❌ Kết nối MySQL thất bại:", error.message);
    throw error;
  }
}

const db = {
  query,
  execute,
  getConnection,
  rawPool,
  checkConnection,
};

// Hỗ trợ cả 2 kiểu import:
// const db = require("../config/database");
// const { pool, checkConnection } = require("../config/database");
module.exports = db;
module.exports.pool = db;
module.exports.rawPool = rawPool;
module.exports.checkConnection = checkConnection;
module.exports.checkConnection = checkConnection;