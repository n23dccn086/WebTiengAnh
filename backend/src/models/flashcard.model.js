const db = require("../config/database");

// =========================
// LẤY FLASHCARD THEO BỘ THẺ
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
    [Number(setId)],
  );

  return rows;
}

// =========================
// LẤY TẤT CẢ FLASHCARD
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
        fs.title AS set_title,
        fs.user_id AS set_owner_id,
        fs.service_id,
        s.title AS service_title
     FROM flashcards f
     LEFT JOIN flashcard_sets fs 
       ON f.set_id = fs.id
     LEFT JOIN services s
       ON fs.service_id = s.id
     ORDER BY f.created_at DESC`,
  );

  return rows;
}

// =========================
// LẤY FLASHCARD THEO SERVICE
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
        fs.title AS set_title,
        fs.service_id,
        s.title AS service_title
     FROM flashcards f
     JOIN flashcard_sets fs 
       ON f.set_id = fs.id
     LEFT JOIN services s
       ON fs.service_id = s.id
     WHERE fs.service_id = ?
     ORDER BY f.created_at DESC`,
    [Number(serviceId)],
  );

  return rows;
}

// =========================
// THÊM FLASHCARD MỚI
// =========================
async function addFlashcard({
  set_id,
  word,
  meaning,
  pronunciation = null,
  example_sentence = null,
  part_of_speech = null,
}) {
  const cleanWord = word?.trim();
  const cleanMeaning = meaning?.trim();

  if (!cleanWord || !cleanMeaning) {
    throw new Error("word và meaning không được để trống");
  }

  const [result] = await db.execute(
    `INSERT INTO flashcards
     (set_id, word, meaning, pronunciation, example_sentence, part_of_speech)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      Number(set_id),
      cleanWord,
      cleanMeaning,
      pronunciation?.trim() || null,
      example_sentence?.trim() || null,
      part_of_speech?.trim() || null,
    ],
  );

  return {
    id: result.insertId,
    set_id: Number(set_id),
    word: cleanWord,
    meaning: cleanMeaning,
    pronunciation: pronunciation?.trim() || null,
    example_sentence: example_sentence?.trim() || null,
    part_of_speech: part_of_speech?.trim() || null,
  };
}

// =========================
// CẬP NHẬT FLASHCARD
// =========================
async function updateFlashcard(
  flashcardId,
  { word, meaning, pronunciation, example_sentence, part_of_speech },
) {
  const [result] = await db.execute(
    `UPDATE flashcards
     SET 
       word = COALESCE(?, word),
       meaning = COALESCE(?, meaning),
       pronunciation = COALESCE(?, pronunciation),
       example_sentence = COALESCE(?, example_sentence),
       part_of_speech = COALESCE(?, part_of_speech)
     WHERE id = ?`,
    [
      word?.trim() || null,
      meaning?.trim() || null,
      pronunciation?.trim() || null,
      example_sentence?.trim() || null,
      part_of_speech?.trim() || null,
      Number(flashcardId),
    ],
  );

  return result.affectedRows > 0;
}

// =========================
// XÓA FLASHCARD
// =========================
async function deleteFlashcard(flashcardId) {
  const [result] = await db.execute(
    `DELETE FROM flashcards 
     WHERE id = ?`,
    [Number(flashcardId)],
  );

  return result.affectedRows > 0;
}

// =========================
// THÊM FLASHCARD VÀO DANH SÁCH HỌC CỦA USER
// =========================
async function addToUserFlashcards(userId, flashcardId) {
  const [result] = await db.execute(
    `INSERT INTO user_flashcards 
      (user_id, flashcard_id, next_review_date)
     VALUES (?, ?, NOW())
     ON DUPLICATE KEY UPDATE 
       next_review_date = next_review_date`,
    [Number(userId), Number(flashcardId)],
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
        f.id AS id,
        f.set_id,
        f.word,
        f.meaning,
        f.pronunciation,
        f.example_sentence,
        f.part_of_speech,
        fs.title AS set_title,
        fs.service_id,
        s.title AS service_title
     FROM user_flashcards uf
     JOIN flashcards f 
       ON uf.flashcard_id = f.id
     JOIN flashcard_sets fs 
       ON f.set_id = fs.id
     LEFT JOIN services s
       ON fs.service_id = s.id
     WHERE uf.user_id = ?
     ORDER BY uf.next_review_date ASC`,
    [Number(userId)],
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
    [Number(flashcardId)],
  );

  return rows[0] || null;
}

// =========================
// KIỂM TRA FLASHCARD ĐÃ TỒN TẠI TRONG BỘ THẺ CHƯA
// =========================
async function findFlashcardBySetAndWord(setId, word) {
  const [rows] = await db.execute(
    `SELECT id 
     FROM flashcards 
     WHERE set_id = ? 
       AND LOWER(word) = LOWER(?)`,
    [Number(setId), word?.trim()],
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
