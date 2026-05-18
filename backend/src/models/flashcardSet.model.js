const db = require("../config/database");

const createSet = async ({ user_id, service_id, title, description, is_system = false, document_id = null }) => {
  const [result] = await db.execute(
    `INSERT INTO flashcard_sets (user_id, service_id, document_id, title, description, is_system)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [user_id, service_id, document_id, title, description, is_system]
  );
  return { id: result.insertId, user_id, service_id, title, description, is_system };
};

const getSetsByUser = async (userId, { page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const [rows] = await db.execute(
    `SELECT s.*, serv.title as service_title, COUNT(f.id) as total_flashcards
     FROM flashcard_sets s
     LEFT JOIN services serv ON s.service_id = serv.id
     LEFT JOIN flashcards f ON f.set_id = s.id
     WHERE s.user_id = ? OR s.is_system = TRUE
     GROUP BY s.id
     ORDER BY s.created_at DESC
     LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );
  const [countRows] = await db.execute(
    `SELECT COUNT(*) as total FROM flashcard_sets WHERE user_id = ? OR is_system = TRUE`,
    [userId]
  );
  return { sets: rows, total: countRows[0].total };
};

const getSetById = async (setId, userId = null) => {
  const [rows] = await db.execute(
    `SELECT s.*, serv.title as service_title,
            (SELECT COUNT(*) FROM flashcards WHERE set_id = s.id) as total_flashcards
     FROM flashcard_sets s
     LEFT JOIN services serv ON s.service_id = serv.id
     WHERE s.id = ? AND (s.user_id = ? OR s.is_system = TRUE)`,
    [setId, userId]
  );
  return rows[0] || null;
};

const updateSet = async (setId, { title, description }) => {
  const [result] = await db.execute(
    `UPDATE flashcard_sets SET title = COALESCE(?, title), description = COALESCE(?, description) WHERE id = ?`,
    [title, description, setId]
  );
  return result.affectedRows > 0;
};

const deleteSet = async (setId, userId) => {
  const [result] = await db.execute(
    `DELETE FROM flashcard_sets WHERE id = ? AND user_id = ? AND is_system = FALSE`,
    [setId, userId]
  );
  return result.affectedRows > 0;
};

const toggleSrs = async (userId, setId, is_srs_enabled, daily_new_words = 20) => {
  const [result] = await db.execute(
    `INSERT INTO user_saved_sets (user_id, set_id, is_srs_enabled, daily_new_words)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE is_srs_enabled = ?, daily_new_words = ?`,
    [userId, setId, is_srs_enabled, daily_new_words, is_srs_enabled, daily_new_words]
  );
  return result.affectedRows > 0;
};

const getSetSettings = async (userId, setId) => {
  const [rows] = await db.execute(
    `SELECT is_srs_enabled, daily_new_words FROM user_saved_sets WHERE user_id = ? AND set_id = ?`,
    [userId, setId]
  );
  return rows[0] || { is_srs_enabled: false, daily_new_words: 20 };
};

module.exports = {
  createSet,
  getSetsByUser,
  getSetById,
  updateSet,
  deleteSet,
  toggleSrs,
  getSetSettings,
};