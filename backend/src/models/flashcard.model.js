const db = require("../config/database");

// =========================
// LẤY TẤT CẢ FLASHCARD
// Dùng cho GET /api/v1/vocab
// =========================
async function getAllFlashcards() {
  const [rows] = await db.execute(
    `SELECT 
        f.id,
        f.service_id,
        f.created_by,
        f.word,
        f.meaning,
        f.pronunciation,
        f.example_sentence,
        f.part_of_speech,
        f.created_at,
        f.updated_at,
        u.full_name AS created_by_name
     FROM flashcards f
     LEFT JOIN users u ON f.created_by = u.id
     ORDER BY f.created_at DESC`,
  );

  return rows;
}

// =========================
// LẤY FLASHCARD THEO SERVICE
// Dùng cho GET /api/v1/vocab/service/:serviceId
// =========================
async function getFlashcardsByService(serviceId) {
  const [rows] = await db.execute(
    `SELECT 
        f.id,
        f.service_id,
        f.created_by,
        f.word,
        f.meaning,
        f.pronunciation,
        f.example_sentence,
        f.part_of_speech,
        f.created_at,
        f.updated_at,
        u.full_name AS created_by_name
     FROM flashcards f
     LEFT JOIN users u ON f.created_by = u.id
     WHERE f.service_id = ?
     ORDER BY f.created_at DESC`,
    [serviceId],
  );

  return rows;
}

// =========================
// THÊM FLASHCARD HỆ THỐNG
// Dùng cho POST /api/v1/vocab
// Chỉ ADMIN / SUPER_ADMIN gọi được ở route
// =========================
async function addFlashcard({
  service_id,
  created_by,
  word,
  meaning,
  pronunciation,
  example_sentence,
  part_of_speech,
}) {
  const [result] = await db.execute(
    `INSERT INTO flashcards
     (
        service_id,
        created_by,
        word,
        meaning,
        pronunciation,
        example_sentence,
        part_of_speech
     )
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      service_id,
      created_by,
      word,
      meaning,
      pronunciation,
      example_sentence,
      part_of_speech,
    ],
  );

  return {
    id: result.insertId,
    service_id,
    created_by,
    word,
    meaning,
    pronunciation,
    example_sentence,
    part_of_speech,
  };
}

// =========================
// CẬP NHẬT FLASHCARD
// Hiện routes/vocabRoutes.js chưa dùng,
// nhưng để sẵn cho chức năng sửa flashcard sau này
// =========================
async function updateFlashcard(
  flashcardId,
  {
    service_id,
    word,
    meaning,
    pronunciation,
    example_sentence,
    part_of_speech,
  },
) {
  const [result] = await db.execute(
    `UPDATE flashcards
     SET service_id = COALESCE(?, service_id),
         word = COALESCE(?, word),
         meaning = COALESCE(?, meaning),
         pronunciation = COALESCE(?, pronunciation),
         example_sentence = COALESCE(?, example_sentence),
         part_of_speech = COALESCE(?, part_of_speech)
     WHERE id = ?`,
    [
      service_id || null,
      word || null,
      meaning || null,
      pronunciation || null,
      example_sentence || null,
      part_of_speech || null,
      flashcardId,
    ],
  );

  return result.affectedRows > 0;
}

// =========================
// XÓA FLASHCARD HỆ THỐNG
// Dùng cho DELETE /api/v1/vocab/:id
// =========================
async function deleteFlashcard(flashcardId) {
  const [result] = await db.execute(
    `DELETE FROM flashcards
     WHERE id = ?`,
    [flashcardId],
  );

  return result.affectedRows > 0;
}

// =========================
// THÊM FLASHCARD VÀO DANH SÁCH HỌC CỦA USER
// Dùng cho POST /api/v1/vocab/learn/:flashcardId
// =========================
async function addToUserFlashcards(userId, flashcardId) {
  const [result] = await db.execute(
    `INSERT INTO user_flashcards
     (
        user_id,
        flashcard_id
     )
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE
        updated_at = CURRENT_TIMESTAMP`,
    [userId, flashcardId],
  );

  return result.affectedRows > 0;
}

// =========================
// LẤY DANH SÁCH FLASHCARD USER ĐANG HỌC
// Có thể dùng cho trang "Từ vựng của tôi"
// =========================
async function getUserFlashcards(userId) {
  const [rows] = await db.execute(
    `SELECT
        uf.id AS user_flashcard_id,
        uf.user_id,
        uf.flashcard_id,
        uf.created_at,
        uf.updated_at,

        f.service_id,
        f.word,
        f.meaning,
        f.pronunciation,
        f.example_sentence,
        f.part_of_speech
     FROM user_flashcards uf
     JOIN flashcards f ON uf.flashcard_id = f.id
     WHERE uf.user_id = ?
     ORDER BY uf.created_at DESC`,
    [userId],
  );

  return rows;
}

// =========================
// KIỂM TRA FLASHCARD CÓ TỒN TẠI KHÔNG
// Dùng khi cần validate nâng cao
// =========================
async function findFlashcardById(flashcardId) {
  const [rows] = await db.execute(
    `SELECT 
        id,
        service_id,
        created_by,
        word,
        meaning,
        pronunciation,
        example_sentence,
        part_of_speech,
        created_at,
        updated_at
     FROM flashcards
     WHERE id = ?`,
    [flashcardId],
  );

  return rows[0] || null;
}

module.exports = {
  getAllFlashcards,
  getFlashcardsByService,
  addFlashcard,
  updateFlashcard,
  deleteFlashcard,
  addToUserFlashcards,
  getUserFlashcards,
  findFlashcardById,
};
