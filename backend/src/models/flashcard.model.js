const db = require('../config/database');

// Lấy toàn bộ từ vựng của 1 bộ thẻ (Dùng cho API 5)
const getFlashcardsBySet = async (setId) => {
  const [rows] = await db.execute(
    `SELECT id, word, meaning, pronunciation, example_sentence, part_of_speech 
     FROM flashcards WHERE set_id = ? ORDER BY created_at ASC`,
    [setId]
  );
  return rows;
};

// Lấy 1 thẻ từ vựng để check quyền (Dùng cho API 13, 14)
const getFlashcardById = async (flashcardId) => {
  const [rows] = await db.execute(
    `SELECT f.id, f.set_id, fs.user_id, fs.is_system 
     FROM flashcards f
     JOIN flashcard_sets fs ON f.set_id = fs.id
     WHERE f.id = ?`,
    [flashcardId]
  );
  return rows[0] || null;
};

// Kiểm tra trùng lặp từ vựng trong 1 bộ (API 12)
const checkDuplicateWord = async (setId, word) => {
  const [rows] = await db.execute(
    `SELECT id FROM flashcards WHERE set_id = ? AND LOWER(word) = LOWER(?)`,
    [setId, word.trim()]
  );
  return rows[0] || null;
};

// Thêm thẻ thủ công (API 12)
const addFlashcard = async (setId, word, meaning, pronunciation, example_sentence, part_of_speech) => {
  const [result] = await db.execute(
    `INSERT INTO flashcards (set_id, word, meaning, pronunciation, example_sentence, part_of_speech) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [setId, word.trim(), meaning.trim(), pronunciation || null, example_sentence || null, part_of_speech || null]
  );
  return { id: result.insertId, word, meaning };
};

// Cập nhật thẻ (API 13)
const updateFlashcard = async (flashcardId, word, meaning, pronunciation, example_sentence, part_of_speech) => {
  await db.execute(
    `UPDATE flashcards 
     SET word = COALESCE(?, word), meaning = COALESCE(?, meaning), 
         pronunciation = COALESCE(?, pronunciation), example_sentence = COALESCE(?, example_sentence), 
         part_of_speech = COALESCE(?, part_of_speech) 
     WHERE id = ?`,
    [word || null, meaning || null, pronunciation || null, example_sentence || null, part_of_speech || null, flashcardId]
  );
};

// Xóa thẻ (API 14)
const deleteFlashcard = async (flashcardId) => {
  await db.execute(`DELETE FROM flashcards WHERE id = ?`, [flashcardId]);
};

// Nhét thẻ mới vào luồng học SRS nếu bộ đó đang bật (Phục vụ API 8 và 12)
const addToUserFlashcards = async (userId, flashcardId) => {
  await db.execute(
    `INSERT INTO user_flashcards (user_id, flashcard_id, next_review_date) 
     VALUES (?, ?, UTC_TIMESTAMP()) 
     ON DUPLICATE KEY UPDATE next_review_date = next_review_date`,
    [userId, flashcardId]
  );
};

module.exports = {
  getFlashcardsBySet,
  getFlashcardById,
  checkDuplicateWord,
  addFlashcard,
  updateFlashcard,
  deleteFlashcard,
  addToUserFlashcards
};