const db = require("../config/database");

const createSet = async ({
  user_id,
  service_id,
  title,
  description,
  is_system = false,
  document_id = null,
}) => {
  const [result] = await db.execute(
    `INSERT INTO flashcard_sets 
      (user_id, service_id, document_id, title, description, is_system)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      Number(user_id),
      Number(service_id),
      document_id,
      title,
      description || null,
      Boolean(is_system),
    ],
  );

  return {
    id: result.insertId,
    user_id: Number(user_id),
    service_id: Number(service_id),
    document_id,
    title,
    description,
    is_system,
  };
};

const getSetsByUser = async (
  userId,
  { page = 1, limit = 20, service_id = null, serviceId = null } = {},
) => {
  const safeUserId = Number(userId);
  const safePage =
    Number.parseInt(page, 10) > 0 ? Number.parseInt(page, 10) : 1;
  const safeLimit =
    Number.parseInt(limit, 10) > 0 ? Number.parseInt(limit, 10) : 20;

  const offset = (safePage - 1) * safeLimit;
  const filterServiceId = service_id || serviceId;

  let sql = `
    SELECT 
      s.id,
      s.user_id,
      s.service_id,
      s.document_id,
      s.title,
      s.description,
      s.is_system,
      s.created_at,
      s.updated_at,
      serv.title AS service_title,
      COUNT(DISTINCT f.id) AS total_flashcards,
      COALESCE(MAX(us.is_srs_enabled), 0) AS is_srs_enabled,
      COALESCE(MAX(us.daily_new_words), 20) AS daily_new_words
    FROM flashcard_sets s
    LEFT JOIN services serv 
      ON s.service_id = serv.id
    LEFT JOIN flashcards f 
      ON f.set_id = s.id
    LEFT JOIN user_saved_sets us 
      ON us.set_id = s.id 
      AND us.user_id = ?
    WHERE (s.user_id = ? OR s.is_system = TRUE)
  `;

  const params = [safeUserId, safeUserId];

  if (filterServiceId) {
    sql += ` AND s.service_id = ?`;
    params.push(Number(filterServiceId));
  }

  sql += `
    GROUP BY 
      s.id,
      s.user_id,
      s.service_id,
      s.document_id,
      s.title,
      s.description,
      s.is_system,
      s.created_at,
      s.updated_at,
      serv.title
    ORDER BY s.created_at DESC
    LIMIT ${safeLimit} OFFSET ${offset}
  `;

  const [rows] = await db.execute(sql, params);

  let countSql = `
    SELECT COUNT(DISTINCT s.id) AS total
    FROM flashcard_sets s
    WHERE (s.user_id = ? OR s.is_system = TRUE)
  `;

  const countParams = [safeUserId];

  if (filterServiceId) {
    countSql += ` AND s.service_id = ?`;
    countParams.push(Number(filterServiceId));
  }

  const [countRows] = await db.execute(countSql, countParams);

  return {
    sets: rows,
    total: countRows[0]?.total || 0,
  };
};

const getSetById = async (setId, userId = null) => {
  const [rows] = await db.execute(
    `SELECT 
        s.id,
        s.user_id,
        s.service_id,
        s.document_id,
        s.title,
        s.description,
        s.is_system,
        s.created_at,
        s.updated_at,
        serv.title AS service_title,
        COUNT(DISTINCT f.id) AS total_flashcards
     FROM flashcard_sets s
     LEFT JOIN services serv 
       ON s.service_id = serv.id
     LEFT JOIN flashcards f 
       ON f.set_id = s.id
     WHERE s.id = ? 
       AND (s.user_id = ? OR s.is_system = TRUE)
     GROUP BY 
        s.id,
        s.user_id,
        s.service_id,
        s.document_id,
        s.title,
        s.description,
        s.is_system,
        s.created_at,
        s.updated_at,
        serv.title`,
    [Number(setId), Number(userId)],
  );

  return rows[0] || null;
};

const updateSet = async (setId, { title, description }) => {
  const [result] = await db.execute(
    `UPDATE flashcard_sets 
     SET 
       title = COALESCE(?, title), 
       description = COALESCE(?, description) 
     WHERE id = ?`,
    [title || null, description || null, Number(setId)],
  );

  return result.affectedRows > 0;
};

const deleteSet = async (setId, userId) => {
  const [result] = await db.execute(
    `DELETE FROM flashcard_sets 
     WHERE id = ? 
       AND user_id = ? 
       AND is_system = FALSE`,
    [Number(setId), Number(userId)],
  );

  return result.affectedRows > 0;
};

const toggleSrs = async (
  userId,
  setId,
  is_srs_enabled,
  daily_new_words = 20,
) => {
  const [result] = await db.execute(
    `INSERT INTO user_saved_sets 
      (user_id, set_id, is_srs_enabled, daily_new_words)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE 
       is_srs_enabled = VALUES(is_srs_enabled), 
       daily_new_words = VALUES(daily_new_words)`,
    [
      Number(userId),
      Number(setId),
      Boolean(is_srs_enabled),
      Number(daily_new_words),
    ],
  );

  return result.affectedRows > 0;
};

const getSetSettings = async (userId, setId) => {
  const [rows] = await db.execute(
    `SELECT is_srs_enabled, daily_new_words 
     FROM user_saved_sets 
     WHERE user_id = ? 
       AND set_id = ?`,
    [Number(userId), Number(setId)],
  );

  return (
    rows[0] || {
      is_srs_enabled: false,
      daily_new_words: 20,
    }
  );
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
