const db = require('../config/database');

const getAllServices = async () => {
  const [rows] = await db.execute(
    `SELECT id, title, description 
     FROM services 
     WHERE status = 'VISIBLE' 
     ORDER BY id ASC`
  );
  return rows;
};

module.exports = {
  getAllServices,
};