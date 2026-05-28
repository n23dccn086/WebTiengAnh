const db = require('../config/database');

// Lấy danh sách bộ thẻ của user (bao gồm bộ tự tạo và bộ hệ thống đã lưu)
const getSetsByUser = async (userId, limit, offset) => {
  const safeLimit = parseInt(limit, 10);
  const safeOffset = parseInt(offset, 10);
  
  const query = `
    SELECT 
      fs.id, fs.title, fs.description, fs.is_system, fs.created_at,
      fs.service_id,
      COALESCE(MAX(uss.is_srs_enabled), 0) AS is_srs_enabled,
      COALESCE(MAX(uss.daily_new_words), 20) AS daily_new_words,
      COUNT(DISTINCT f.id) AS total_cards
    FROM flashcard_sets fs
    LEFT JOIN user_saved_sets uss ON fs.id = uss.set_id AND uss.user_id = ?
    LEFT JOIN flashcards f ON fs.id = f.set_id
    WHERE fs.user_id = ? OR uss.user_id = ?
    GROUP BY fs.id, fs.service_id
    ORDER BY fs.created_at DESC
    LIMIT ${safeLimit} OFFSET ${safeOffset}
  `;
  
  console.log('[DEBUG] getSetsByUser - userId:', userId);
  const [rows] = await db.execute(query, [userId, userId, userId]);
  console.log('[DEBUG] getSetsByUser - rows found:', rows.length);
  if (rows.length > 0) console.log('[DEBUG] First row:', rows[0]);

  const countQuery = `
    SELECT COUNT(DISTINCT fs.id) AS total
    FROM flashcard_sets fs
    LEFT JOIN user_saved_sets uss ON fs.id = uss.set_id AND uss.user_id = ?
    WHERE fs.user_id = ? OR uss.user_id = ?
  `;
  const [[{ total }]] = await db.execute(countQuery, [userId, userId, userId]);
  console.log('[DEBUG] total items:', total);
  
  return { sets: rows, totalItems: total || 0 };
};

// Lấy danh sách bộ thẻ hệ thống
const getSystemSets = async (userId) => {
  const query = `
    SELECT 
      fs.id, fs.title, fs.description,
      s.title AS service_title,
      COUNT(DISTINCT f.id) AS total_cards,
      IF(uss.set_id IS NOT NULL, TRUE, FALSE) AS is_saved
    FROM flashcard_sets fs
    LEFT JOIN services s ON fs.service_id = s.id
    LEFT JOIN flashcards f ON fs.id = f.set_id
    LEFT JOIN user_saved_sets uss ON fs.id = uss.set_id AND uss.user_id = ?
    WHERE fs.is_system = TRUE
    GROUP BY fs.id
    ORDER BY fs.created_at DESC
  `;
  const [rows] = await db.execute(query, [userId]);
  return rows;
};

// Tạo bộ thẻ mới (có transaction)
const createSet = async (userId, title, description, serviceId) => {
  const connection = await db.getConnection();
  const promiseConnection = connection.promise();
  try {
    await promiseConnection.beginTransaction();
    const [result] = await promiseConnection.execute(
      `INSERT INTO flashcard_sets (user_id, service_id, title, description, is_system) VALUES (?, ?, ?, ?, FALSE)`,
      [userId, serviceId, title, description || null]
    );
    const setId = result.insertId;
    await promiseConnection.execute(
      `INSERT INTO user_saved_sets (user_id, set_id, is_srs_enabled, daily_new_words) VALUES (?, ?, FALSE, 20)`,
      [userId, setId]
    );
    await promiseConnection.commit();
    return { id: setId, title, total_cards: 0 };
  } catch (error) {
    await promiseConnection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Lấy chi tiết bộ thẻ
const getSetById = async (setId, userId) => {
  const query = `
    SELECT fs.id, fs.title, fs.description, fs.user_id, fs.is_system,
           COALESCE(uss.is_srs_enabled, 0) AS is_srs_enabled, 
           COALESCE(uss.daily_new_words, 20) AS daily_new_words
    FROM flashcard_sets fs
    LEFT JOIN user_saved_sets uss ON fs.id = uss.set_id AND uss.user_id = ?
    WHERE fs.id = ?
  `;
  const [rows] = await db.execute(query, [userId, setId]);
  return rows[0] || null;
};

// Cập nhật bộ thẻ
const updateSet = async (setId, title, description) => {
  await db.execute(
    `UPDATE flashcard_sets SET title = COALESCE(?, title), description = COALESCE(?, description) WHERE id = ?`,
    [title || null, description || null, setId]
  );
};

// Xóa bộ thẻ
const deleteSet = async (setId) => {
  await db.execute(`DELETE FROM flashcard_sets WHERE id = ?`, [setId]);
};

// Bật/tắt SRS
const toggleSrs = async (userId, setId, isSrsEnabled, dailyNewWords) => {
  await db.execute(
    `INSERT INTO user_saved_sets (user_id, set_id, is_srs_enabled, daily_new_words) 
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE is_srs_enabled = VALUES(is_srs_enabled), daily_new_words = VALUES(daily_new_words)`,
    [userId, setId, isSrsEnabled, dailyNewWords]
  );
};

// Lưu/bỏ lưu bộ hệ thống
const saveSystemSet = async (userId, setId, action) => {
  if (action === 'SAVE') {
    await db.execute(
      `INSERT IGNORE INTO user_saved_sets (user_id, set_id, is_srs_enabled, daily_new_words) VALUES (?, ?, FALSE, 20)`,
      [userId, setId]
    );
  } else {
    await db.execute(`DELETE FROM user_saved_sets WHERE user_id = ? AND set_id = ?`, [userId, setId]);
  }
};

module.exports = {
  getSetsByUser,
  getSystemSets,
  createSet,
  getSetById,
  updateSet,
  deleteSet,
  toggleSrs,
  saveSystemSet,
};