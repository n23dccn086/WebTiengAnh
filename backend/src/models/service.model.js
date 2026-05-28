const db = require('../config/database');

// Lấy danh sách service có status = VISIBLE (dùng cho frontend user)
const getAllServices = async () => {
  const [rows] = await db.execute(
    `SELECT id, title, description 
     FROM services 
     WHERE status = 'VISIBLE' 
     ORDER BY id ASC`
  );
  return rows;
};

// Lấy tất cả service (kể cả HIDDEN) cho admin
const getAllServicesForAdmin = async () => {
  const [rows] = await db.execute(
    `SELECT id, title, description, status 
     FROM services 
     ORDER BY id ASC`
  );
  return rows;
};

module.exports = {
  getAllServices,
  getAllServicesForAdmin,
};