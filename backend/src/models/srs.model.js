const db = require('../config/database');

// API 7: Lấy từ vựng tới hạn ôn tập HÔM NAY (Kèm limit)
const getDueFlashcards = async (userId, limit = 20) => {
  const query = `
    SELECT 
      uf.id AS user_flashcard_id, uf.status, uf.repetition_count, 
      uf.ease_factor, uf.interval_days, uf.next_review_date,
      f.id AS flashcard_id, f.word, f.meaning, f.pronunciation, f.example_sentence, f.part_of_speech,
      fs.id AS set_id, fs.title AS set_title
    FROM user_flashcards uf
    JOIN flashcards f ON uf.flashcard_id = f.id
    JOIN flashcard_sets fs ON f.set_id = fs.id
    JOIN user_saved_sets uss ON uss.set_id = fs.id AND uss.user_id = uf.user_id
    WHERE uf.user_id = ? 
      AND uf.next_review_date <= NOW() 
      AND uss.is_srs_enabled = TRUE
    ORDER BY uf.next_review_date ASC
    LIMIT ?
  `;
  // SỬ DỤNG db.query thay vì execute để không bị lỗi LIMIT
  const [rows] = await db.query(query, [userId, Number(limit)]);
  return rows;
};

// API 8: Cập nhật chỉ số thẻ sau khi bấm nút (AGAIN, HARD, GOOD, EASY)
const updateFlashcardProgress = async (userId, flashcardId, sm2Data) => {
  await db.query(
    `UPDATE user_flashcards
     SET repetition_count = ?, ease_factor = ?, interval_days = ?, 
         next_review_date = ?, status = 'REVIEW', last_reviewed_at = NOW()
     WHERE user_id = ? AND flashcard_id = ?`,
    [
      sm2Data.repetitionCount, sm2Data.easeFactor, sm2Data.intervalDays, 
      sm2Data.nextReviewDate, userId, flashcardId
    ]
  );
};

// API 10: Lấy danh sách ID thẻ mới (Chưa từng học) của các bộ thẻ ĐANG BẬT SRS
const getNewCardIds = async (userId, limit) => {
  const [rows] = await db.query(
    `SELECT f.id AS flashcard_id 
     FROM flashcards f
     JOIN user_saved_sets uss ON f.set_id = uss.set_id
     WHERE uss.user_id = ? 
       AND uss.is_srs_enabled = TRUE
       AND f.id NOT IN (
         SELECT flashcard_id FROM user_flashcards WHERE user_id = ?
       )
     LIMIT ?`,
    [userId, userId, Number(limit)]
  );
  return rows.map(r => r.flashcard_id);
};

// API 9 & 10: Đưa thẻ mới vào luồng học (INSERT vào user_flashcards)
const startLearningNewCards = async (userId, flashcardIds) => {
  if (!flashcardIds || flashcardIds.length === 0) return;
  
  const values = [];
  const placeholders = [];
  
  for (const cardId of flashcardIds) {
    placeholders.push(`(?, ?, 'NEW', NOW())`);
    values.push(userId, cardId);
  }

  const sql = `INSERT INTO user_flashcards (user_id, flashcard_id, status, next_review_date) VALUES ${placeholders.join(',')}`;
  
  // SỬ DỤNG db.query để Insert số lượng lớn cực mượt mà không văng lỗi Arguments
  await db.query(sql, values);
};

module.exports = {
  getDueFlashcards,
  updateFlashcardProgress,
  startLearningNewCards,
  getNewCardIds
};