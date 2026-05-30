const db = require('../config/database');

const getDueFlashcards = async (userId, limit = 20) => {
  const query = `
    SELECT 
      uf.id AS user_flashcard_id,
      uf.status,
      uf.repetition_count,
      uf.ease_factor,
      uf.interval_days,
      uf.next_review_date,
      f.id AS flashcard_id,
      f.word,
      f.meaning,
      f.pronunciation,
      f.example_sentence,
      f.part_of_speech,
      fs.id AS set_id,
      fs.title AS set_title
    FROM user_flashcards uf
    JOIN flashcards f ON uf.flashcard_id = f.id
    JOIN flashcard_sets fs ON f.set_id = fs.id
    JOIN user_saved_sets uss ON fs.id = uss.set_id AND uss.user_id = uf.user_id
    WHERE uf.user_id = ?
      AND uf.next_review_date <= NOW()
      AND uss.is_srs_enabled = TRUE
    ORDER BY uf.next_review_date ASC
    LIMIT ?
  `;
  const [results, fields] = await db.query(query, [userId, Number(limit)]);
  console.log(`[DEBUG getDueFlashcards] userId=${userId}, limit=${limit}, count=${results.length}`);
  if (results.length > 0) {
    console.log(`[DEBUG] First row:`, results[0]);
  }
  return results;
};

const updateFlashcardProgress = async (userId, flashcardId, sm2Data) => {
  await db.query(
    `UPDATE user_flashcards
     SET repetition_count = ?, ease_factor = ?, interval_days = ?, 
         next_review_date = ?, status = 'REVIEW', last_reviewed_at = NOW()
     WHERE user_id = ? AND flashcard_id = ?`,
    [
      sm2Data.repetitionCount,
      sm2Data.easeFactor,
      sm2Data.intervalDays,
      sm2Data.nextReviewDate,
      userId,
      flashcardId
    ]
  );
};

const startLearningNewCards = async (userId, flashcardIds) => {
  if (!flashcardIds || flashcardIds.length === 0) return;
  const values = [];
  const placeholders = [];
  for (const cardId of flashcardIds) {
    placeholders.push(`(?, ?, 'NEW', UTC_TIMESTAMP())`);
    values.push(userId, cardId);
  }
  const sql = `INSERT INTO user_flashcards (user_id, flashcard_id, status, next_review_date) VALUES ${placeholders.join(',')}`;
  await db.query(sql, values);
};

const getNewCardIds = async (userId, limit) => {
  const [results, fields] = await db.query(
    `SELECT f.id AS flashcard_id
     FROM flashcards f
     JOIN user_saved_sets uss ON f.set_id = uss.set_id
     WHERE uss.user_id = ?
       AND uss.is_srs_enabled = TRUE
       AND f.id NOT IN (SELECT flashcard_id FROM user_flashcards WHERE user_id = ?)
     LIMIT ?`,
    [userId, userId, Number(limit)]
  );
  return results.map(r => r.flashcard_id);
};

module.exports = {
  getDueFlashcards,
  updateFlashcardProgress,
  startLearningNewCards,
  getNewCardIds
};