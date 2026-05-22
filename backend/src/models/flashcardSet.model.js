const db = require('../config/database');

// Lấy bộ thẻ của User (API 2)
// Lấy bộ thẻ của User (API 2)
const getSetsByUser = async (userId, limit, offset) => {
  const query = `
    SELECT 
      fs.id, fs.title, fs.description, fs.is_system, fs.created_at,
      s.id AS service_id, s.title AS service_title,
      COALESCE(MAX(uss.is_srs_enabled), 0) AS is_srs_enabled, 
      COALESCE(MAX(uss.daily_new_words), 20) AS daily_new_words,
      COUNT(DISTINCT f.id) AS total_cards
    FROM flashcard_sets fs
    LEFT JOIN services s ON fs.service_id = s.id
    LEFT JOIN user_saved_sets uss ON fs.id = uss.set_id AND uss.user_id = ?
    LEFT JOIN flashcards f ON fs.id = f.set_id
    WHERE fs.user_id = ? OR uss.user_id = ?
    GROUP BY fs.id, s.id, s.title
    ORDER BY fs.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
  const [rows] = await db.execute(query, [userId, userId, userId]);

  const countQuery = `
    SELECT COUNT(DISTINCT fs.id) AS total
    FROM flashcard_sets fs
    LEFT JOIN user_saved_sets uss ON fs.id = uss.set_id AND uss.user_id = ?
    WHERE fs.user_id = ? OR uss.user_id = ?
  `;
  const [[{ total }]] = await db.execute(countQuery, [userId, userId, userId]);

  return { sets: rows, totalItems: total || 0 };
};

// Lấy bộ thẻ Hệ thống (API 3)
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

// Tạo bộ thẻ mới (API 4) - Dùng Transaction với hàm wrapper của team bạn
const createSet = async (userId, title, description, serviceId) => {
  const connection = await db.getConnection();
  
  const execTx = (sql, params) => new Promise((res, rej) => connection.execute(sql, params, (err, results) => err ? rej(err) : res(results)));
  const beginTx = () => new Promise((res, rej) => connection.beginTransaction(err => err ? rej(err) : res()));
  const commitTx = () => new Promise((res, rej) => connection.commit(err => err ? rej(err) : res()));
  const rollbackTx = () => new Promise((res) => connection.rollback(() => res()));

  try {
    await beginTx();

    const result = await execTx(
      `INSERT INTO flashcard_sets (user_id, service_id, title, description, is_system) VALUES (?, ?, ?, ?, FALSE)`,
      [userId, serviceId, title, description || null]
    );
    const setId = result.insertId;

    await execTx(
      `INSERT INTO user_saved_sets (user_id, set_id, is_srs_enabled, daily_new_words) VALUES (?, ?, FALSE, 20)`,
      [userId, setId]
    );

    await commitTx();
    return { id: setId, title, total_cards: 0 };
  } catch (error) {
    await rollbackTx();
    throw error;
  } finally {
    connection.release();
  }
};

// Lấy 1 bộ thẻ (API 5)
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

// Cập nhật bộ thẻ (API 6)
const updateSet = async (setId, title, description) => {
  await db.execute(
    `UPDATE flashcard_sets SET title = COALESCE(?, title), description = COALESCE(?, description) WHERE id = ?`,
    [title || null, description || null, setId]
  );
};

// Xóa bộ thẻ (API 7)
const deleteSet = async (setId) => {
  await db.execute(`DELETE FROM flashcard_sets WHERE id = ?`, [setId]);
};

// Bật/Tắt SRS (API 8)
const toggleSrs = async (userId, setId, isSrsEnabled, dailyNewWords) => {
  await db.execute(
    `INSERT INTO user_saved_sets (user_id, set_id, is_srs_enabled, daily_new_words) 
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE is_srs_enabled = VALUES(is_srs_enabled), daily_new_words = VALUES(daily_new_words)`,
    [userId, setId, isSrsEnabled, dailyNewWords]
  );
};

// Lưu/Bỏ lưu bộ hệ thống (API 9, 10)
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
  saveSystemSet
};