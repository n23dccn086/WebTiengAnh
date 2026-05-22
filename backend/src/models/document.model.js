const db = require('../config/database');

// Đếm số file PDF user đã upload trong tháng hiện tại
const countDocsInCurrentMonth = async (userId) => {
  const [rows] = await db.execute(
    `SELECT COUNT(id) as total 
     FROM documents 
     WHERE user_id = ? 
       AND MONTH(created_at) = MONTH(CURRENT_DATE()) 
       AND YEAR(created_at) = YEAR(CURRENT_DATE())`,
    [userId]
  );
  return rows[0].total;
};

// Lưu lịch sử upload file
const createDocument = async (userId, fileName, pageCount) => {
  const [result] = await db.execute(
    `INSERT INTO documents (user_id, file_name, file_url, page_count, status) 
     VALUES (?, ?, 'upload_from_memory', ?, 'COMPLETED')`,
    [userId, fileName, pageCount]
  );
  return result.insertId;
};

module.exports = {
  countDocsInCurrentMonth,
  createDocument
};