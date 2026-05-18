const db = require("../config/database");

// =========================
// LẤY FLASHCARD THEO BỘ THẺ (SET_ID)
// =========================
async function getFlashcardsBySet(setId) {
  const [rows] = await db.execute(
    `SELECT 
        id,
        set_id,
        word,
        meaning,
        pronunciation,
        example_sentence,
        part_of_speech,
        created_at
     FROM flashcards
     WHERE set_id = ?
     ORDER BY created_at ASC`,
    [setId]
  );
  return rows;
}

// =========================
// LẤY TẤT CẢ FLASHCARD (kèm thông tin bộ thẻ)
// =========================
async function getAllFlashcards() {
  const [rows] = await db.execute(
    `SELECT 
        f.id,
        f.set_id,
        f.word,
        f.meaning,
        f.pronunciation,
        f.example_sentence,
        f.part_of_speech,
        f.created_at,
        s.title AS set_title,
        s.user_id AS set_owner_id
     FROM flashcards f
     LEFT JOIN flashcard_sets s ON f.set_id = s.id
     ORDER BY f.created_at DESC`,
  );
  return rows;
}

// =========================
// LẤY FLASHCARD THEO SERVICE (thông qua flashcard_sets)
// =========================
async function getFlashcardsByService(serviceId) {
  const [rows] = await db.execute(
    `SELECT 
        f.id,
        f.set_id,
        f.word,
        f.meaning,
        f.pronunciation,
        f.example_sentence,
        f.part_of_speech,
        f.created_at,
        s.title AS set_title
     FROM flashcards f
     JOIN flashcard_sets s ON f.set_id = s.id
     WHERE s.service_id = ?
     ORDER BY f.created_at DESC`,
    [serviceId]
  );
  return rows;
}

// =========================
// THÊM FLASHCARD MỚI VÀO BỘ THỂ
// =========================
async function addFlashcard({
  set_id,
  word,
  meaning,
  pronunciation = null,
  example_sentence = null,
  part_of_speech = null,
}) {
  const [result] = await db.execute(
    `INSERT INTO flashcards
     (set_id, word, meaning, pronunciation, example_sentence, part_of_speech)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [set_id, word, meaning, pronunciation, example_sentence, part_of_speech]
  );
  return {
    id: result.insertId,
    set_id,
    word,
    meaning,
    pronunciation,
    example_sentence,
    part_of_speech,
  };
}

// =========================
// CẬP NHẬT FLASHCARD
// =========================
async function updateFlashcard(
  flashcardId,
  { word, meaning, pronunciation, example_sentence, part_of_speech }
) {
  const [result] = await db.execute(
    `UPDATE flashcards
     SET word = COALESCE(?, word),
         meaning = COALESCE(?, meaning),
         pronunciation = COALESCE(?, pronunciation),
         example_sentence = COALESCE(?, example_sentence),
         part_of_speech = COALESCE(?, part_of_speech)
     WHERE id = ?`,
    [word, meaning, pronunciation, example_sentence, part_of_speech, flashcardId]
  );
  return result.affectedRows > 0;
}

// =========================
// XÓA FLASHCARD
// =========================
async function deleteFlashcard(flashcardId) {
  const [result] = await db.execute(
    `DELETE FROM flashcards WHERE id = ?`,
    [flashcardId]
  );
  return result.affectedRows > 0;
}

// =========================
// THÊM FLASHCARD VÀO DANH SÁCH HỌC CỦA USER (user_flashcards)
// =========================
async function addToUserFlashcards(userId, flashcardId) {
  const [result] = await db.execute(
    `INSERT INTO user_flashcards (user_id, flashcard_id, next_review_date)
     VALUES (?, ?, NOW())
     ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP`,
    [userId, flashcardId]
  );
  return result.affectedRows > 0;
}

// =========================
// LẤY DANH SÁCH FLASHCARD USER ĐANG HỌC
// =========================
async function getUserFlashcards(userId) {
  const [rows] = await db.execute(
    `SELECT
        uf.id AS user_flashcard_id,
        uf.user_id,
        uf.flashcard_id,
        uf.status,
        uf.repetition_count,
        uf.ease_factor,
        uf.interval_days,
        uf.next_review_date,
        uf.last_reviewed_at,
        f.word,
        f.meaning,
        f.pronunciation,
        f.example_sentence,
        f.part_of_speech,
        fs.title AS set_title
     FROM user_flashcards uf
     JOIN flashcards f ON uf.flashcard_id = f.id
     JOIN flashcard_sets fs ON f.set_id = fs.id
     WHERE uf.user_id = ?
     ORDER BY uf.next_review_date ASC`,
    [userId]
  );
  return rows;
}

// =========================
// KIỂM TRA FLASHCARD CÓ TỒN TẠI KHÔNG
// =========================
async function findFlashcardById(flashcardId) {
  const [rows] = await db.execute(
    `SELECT 
        id,
        set_id,
        word,
        meaning,
        pronunciation,
        example_sentence,
        part_of_speech,
        created_at
     FROM flashcards
     WHERE id = ?`,
    [flashcardId]
  );
  return rows[0] || null;
}

// =========================
// KIỂM TRA FLASHCARD ĐÃ TỒN TẠI TRONG BỘ THẺ CHƯA
// =========================
async function findFlashcardBySetAndWord(setId, word) {
  const [rows] = await db.execute(
    `SELECT id FROM flashcards WHERE set_id = ? AND word = ?`,
    [setId, word]
  );
  return rows[0] || null;
}

module.exports = {
  getFlashcardsBySet,
  getAllFlashcards,
  getFlashcardsByService,
  addFlashcard,
  updateFlashcard,
  deleteFlashcard,
  addToUserFlashcards,
  getUserFlashcards,
  findFlashcardById,
  findFlashcardBySetAndWord,
};