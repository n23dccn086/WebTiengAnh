const db = require('../config/database');

// ==========================================
// API 4: LẤY DANH SÁCH USER (KÈM PHÂN TRANG & TÌM KIẾM)
// ==========================================
const getUsers = async (limit, offset, search, status, role) => {
  let queryStr = `
    SELECT u.id, u.email, u.full_name, u.status, u.ai_quota, u.premium_until, r.name as role 
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE 1=1
  `;
  let countQueryStr = `
    SELECT COUNT(*) as total 
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    queryStr += ` AND (u.email LIKE ? OR u.full_name LIKE ?)`;
    countQueryStr += ` AND (u.email LIKE ? OR u.full_name LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }
  if (status) {
    queryStr += ` AND u.status = ?`;
    countQueryStr += ` AND u.status = ?`;
    params.push(status);
  }
  if (role) {
    queryStr += ` AND r.name = ?`;
    countQueryStr += ` AND r.name = ?`;
    params.push(role);
  }

  const limitNum = Math.max(1, parseInt(limit, 10));
  const offsetNum = Math.max(0, parseInt(offset, 10));
  queryStr += ` ORDER BY u.created_at DESC LIMIT ${limitNum} OFFSET ${offsetNum}`;
  
  const [rows] = await db.execute(queryStr, params);
  const [countResult] = await db.execute(countQueryStr, params);
  return { users: rows, total: countResult[0].total };
};

// ==========================================
// API 5 & 6: CẬP NHẬT STATUS VÀ ROLE CHO USER
// ==========================================
const updateUserStatus = async (userId, status) => {
  await db.execute(`UPDATE users SET status = ? WHERE id = ?`, [status, userId]);
};

const updateUserRole = async (userId, roleName) => {
  await db.execute(
    `UPDATE users SET role_id = (SELECT id FROM roles WHERE name = ?) WHERE id = ?`,
    [roleName, userId]
  );
};

// ==========================================
// API 7: QUẢN LÝ SERVICES
// ==========================================
const createService = async (title, description, status) => {
  const [result] = await db.execute(
    `INSERT INTO services (title, description, status) VALUES (?, ?, ?)`,
    [title, description, status || 'VISIBLE']
  );
  return result.insertId;
};

const updateService = async (serviceId, title, description, status) => {
  await db.execute(
    `UPDATE services SET title = ?, description = ?, status = ? WHERE id = ?`,
    [title, description, status, serviceId]
  );
};

const updateServiceStatus = async (serviceId, status) => {
  await db.execute(`UPDATE services SET status = ? WHERE id = ?`, [status, serviceId]);
};

const deleteService = async (serviceId) => {
  await db.execute(`DELETE FROM services WHERE id = ?`, [serviceId]);
};

// ==========================================
// API 8: TẠO BỘ FLASHCARD HỆ THỐNG (CÓ TRANSACTION, KHÔNG TỰ LƯU VÀO THƯ VIỆN)
// ==========================================
const createSystemFlashcardSet = async (adminId, serviceId, title, description, flashcards) => {
  const rawConnection = await db.getConnection();
  const connection = rawConnection.promise();
  try {
    await connection.beginTransaction();
    
    const [setResult] = await connection.execute(
      `INSERT INTO flashcard_sets (user_id, service_id, title, description, is_system) VALUES (?, ?, ?, ?, TRUE)`,
      [adminId, serviceId, title, description || null]
    );
    const setId = setResult.insertId;

    // ✅ ĐÃ XÓA HOÀN TOÀN DÒNG INSERT VÀO user_saved_sets
    // Không tự động lưu bộ thẻ vào thư viện cá nhân của admin

    if (flashcards && flashcards.length > 0) {
      const values = [];
      const placeholders = flashcards.map(card => {
        values.push(setId, card.word, card.meaning, card.pronunciation || null, card.example_sentence || null, card.part_of_speech || null);
        return `(?, ?, ?, ?, ?, ?)`;
      }).join(', ');
      
      await connection.execute(
        `INSERT INTO flashcards (set_id, word, meaning, pronunciation, example_sentence, part_of_speech) VALUES ${placeholders}`,
        values
      );
    }

    await connection.commit();
    return setId;
  } catch (error) {
    await connection.rollback();
    console.error('🔥 Lỗi tạo bộ thẻ hệ thống:', error);
    throw error;
  } finally {
    rawConnection.release();
  }
};

// ==========================================
// API 9: XEM DANH SÁCH GIAO DỊCH & DOANH THU
// ==========================================
const getTransactions = async (limit, offset, status) => {
  let queryStr = `
    SELECT t.id, t.transaction_ref, t.amount, t.provider, t.status, t.created_at, u.email 
    FROM transactions t
    JOIN users u ON t.user_id = u.id
    WHERE 1=1
  `;
  let countQueryStr = `
    SELECT COUNT(*) as total
    FROM transactions t
    JOIN users u ON t.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    queryStr += ` AND t.status = ?`;
    countQueryStr += ` AND t.status = ?`;
    params.push(status);
  }

  const limitNum = Math.max(1, parseInt(limit, 10));
  const offsetNum = Math.max(0, parseInt(offset, 10));

  queryStr += ` ORDER BY t.created_at DESC LIMIT ${limitNum} OFFSET ${offsetNum}`;
  
  const [rows] = await db.execute(queryStr, params);
  const [countResult] = await db.execute(countQueryStr, params);
  const total = countResult[0].total;

  let revenueQuery = `SELECT SUM(amount) as total_revenue FROM transactions WHERE status = 'SUCCESS'`;
  let revenueParams = [];
  if (status === 'SUCCESS') {
    revenueQuery += ` AND status = ?`;
    revenueParams.push(status);
  }
  const [revenueResult] = await db.execute(revenueQuery, revenueParams);

  return {
    transactions: rows,
    total,
    total_revenue: revenueResult[0].total_revenue || 0
  };
};

// ==========================================
// API 10: QUẢN LÝ ADMIN (SUPER_ADMIN)
// ==========================================
const createStaff = async (email, full_name, passwordHash) => {
  const [result] = await db.execute(
    `INSERT INTO users (email, full_name, password_hash, role_id, status) 
     VALUES (?, ?, ?, (SELECT id FROM roles WHERE name = 'ADMIN'), 'ACTIVE')`,
    [email, full_name, passwordHash]
  );
  return result.insertId;
};

const deleteStaff = async (staffId) => {
  await db.execute(`DELETE FROM users WHERE id = ?`, [staffId]);
};

const updateStaffPassword = async (staffId, passwordHash) => {
  await db.execute(`UPDATE users SET password_hash = ? WHERE id = ?`, [passwordHash, staffId]);
};

// Truy vấn 1: Lấy tên dịch vụ
const getServiceTitleById = async (serviceId) => {
  const [rows] = await db.execute('SELECT title FROM services WHERE id = ?', [serviceId]);
  return rows.length > 0 ? rows[0].title : null;
};

// Truy vấn 2: Lấy danh sách bộ thẻ thuộc dịch vụ đó
const getSystemSetsByService = async (serviceId) => {
  const query = `
    SELECT 
      fs.id, 
      fs.title, 
      fs.description, 
      fs.is_system,
      COUNT(f.id) AS total_cards
    FROM flashcard_sets fs
    LEFT JOIN flashcards f ON fs.id = f.set_id
    WHERE fs.service_id = ? AND fs.is_system = TRUE
    GROUP BY fs.id
    ORDER BY fs.created_at DESC
  `;
  const [sets] = await db.execute(query, [serviceId]);
  return sets;
};

const getStaffList = async () => {
  const query = `
    SELECT u.id, u.email, u.full_name, u.status, u.created_at, r.name as role 
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE r.name IN ('ADMIN', 'SUPER_ADMIN')
    ORDER BY u.created_at DESC
  `;
  const [rows] = await db.execute(query);
  return rows;
};

module.exports = {
  getStaffList,
  getServiceTitleById,
  getSystemSetsByService,
  getUsers,
  updateUserStatus,
  updateUserRole,
  createService,
  updateService,
  updateServiceStatus,
  deleteService,
  createSystemFlashcardSet,
  getTransactions,
  createStaff,
  deleteStaff,
  updateStaffPassword
};