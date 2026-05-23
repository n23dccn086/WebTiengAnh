const db = require('../config/database');

const createTransaction = async (userId, orderId, amount, status) => {
  // Sửa thành transaction_ref và thêm provider = 'MOMO'
  const [result] = await db.execute(
    `INSERT INTO transactions (user_id, transaction_ref, amount, provider, status) 
     VALUES (?, ?, ?, 'MOMO', ?)`,
    [userId, orderId, amount, status]
  );
  return result.insertId;
};

const getTransactionByOrderId = async (orderId) => {
  // Sửa order_id thành transaction_ref
  const [rows] = await db.execute(
    `SELECT * FROM transactions WHERE transaction_ref = ?`,
    [orderId]
  );
  return rows.length ? rows[0] : null;
};

const updateTransactionStatus = async (connection, orderId, status) => {
  // Sửa order_id thành transaction_ref
  await connection.execute(
    `UPDATE transactions SET status = ? WHERE transaction_ref = ?`,
    [status, orderId]
  );
};

const upgradeUserToPremium = async (connection, userId) => {
  await connection.execute(
    `UPDATE users 
     SET role_id = (SELECT id FROM roles WHERE name = 'PREMIUM'),
         premium_until = DATE_ADD(NOW(), INTERVAL 30 DAY),
         ai_quota = 200
     WHERE id = ?`,
    [userId]
  );
};

module.exports = {
  createTransaction,
  getTransactionByOrderId,
  updateTransactionStatus,
  upgradeUserToPremium,
};