const db = require("../config/database");

// Tạo một bài test mới (test_attempts)
const createAttempt = async (userId, setId) => {
  const [result] = await db.execute(
    `INSERT INTO test_attempts (user_id, set_id, status, total_questions)
     VALUES (?, ?, 'IN_PROGRESS', 0)`,
    [userId, setId]
  );
  return result.insertId;
};

// Lưu câu hỏi và options vào test_questions, test_options
const saveQuestionsAndOptions = async (attemptId, questions, flashcards) => {
  let total = 0;
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    // Tìm flashcard_id tương ứng (dựa trên word hoặc lấy từ flashcards)
    let flashcardId = flashcards.find(f => f.word.toLowerCase() === q.question.toLowerCase().split(' ')[0])?.id;
    if (!flashcardId && flashcards.length) flashcardId = flashcards[0].id;
    const [qResult] = await db.execute(
      `INSERT INTO test_questions (attempt_id, flashcard_id, content, explanation, question_type, order_index)
       VALUES (?, ?, ?, ?, 'MULTIPLE_CHOICE', ?)`,
      [attemptId, flashcardId, q.question, q.explanation || '', i]
    );
    const questionId = qResult.insertId;
    for (let j = 0; j < q.options.length; j++) {
      await db.execute(
        `INSERT INTO test_options (question_id, content, is_correct) VALUES (?, ?, ?)`,
        [questionId, q.options[j], j === q.correct_index]
      );
    }
    total++;
  }
  // Cập nhật total_questions
  await db.execute(`UPDATE test_attempts SET total_questions = ? WHERE id = ?`, [total, attemptId]);
  return total;
};

// Lấy câu hỏi và options của một attempt (để trả về frontend)
const getQuestionsByAttempt = async (attemptId) => {
  const [questions] = await db.execute(
    `SELECT q.id, q.content, q.explanation,
            JSON_ARRAYAGG(JSON_OBJECT('id', o.id, 'content', o.content, 'is_correct', o.is_correct)) as options
     FROM test_questions q
     LEFT JOIN test_options o ON q.id = o.question_id
     WHERE q.attempt_id = ?
     GROUP BY q.id
     ORDER BY q.order_index`,
    [attemptId]
  );
  return questions;
};

// Auto-save: lưu hoặc cập nhật câu trả lời
const saveAnswer = async (attemptId, questionId, selectedOptionId) => {
  const [existing] = await db.execute(
    `SELECT id FROM test_answers WHERE attempt_id = ? AND question_id = ?`,
    [attemptId, questionId]
  );
  if (existing.length > 0) {
    await db.execute(
      `UPDATE test_answers SET selected_option_id = ?, answered_at = NOW() WHERE attempt_id = ? AND question_id = ?`,
      [selectedOptionId, attemptId, questionId]
    );
  } else {
    await db.execute(
      `INSERT INTO test_answers (attempt_id, question_id, selected_option_id, answered_at)
       VALUES (?, ?, ?, NOW())`,
      [attemptId, questionId, selectedOptionId]
    );
  }
  await db.execute(`UPDATE test_attempts SET last_saved_at = NOW() WHERE id = ?`, [attemptId]);
};

// Nộp bài: tính điểm và cập nhật status
const submitAttempt = async (attemptId) => {
  // Lấy tất cả câu trả lời của attempt
  const [answers] = await db.execute(
    `SELECT a.question_id, a.selected_option_id, o.is_correct
     FROM test_answers a
     LEFT JOIN test_options o ON a.selected_option_id = o.id
     WHERE a.attempt_id = ?`,
    [attemptId]
  );
  let correctCount = 0;
  for (const ans of answers) {
    const isCorrect = ans.is_correct === 1 ? 1 : 0;
    if (isCorrect) correctCount++;
    await db.execute(
      `UPDATE test_answers SET is_correct = ? WHERE attempt_id = ? AND question_id = ?`,
      [isCorrect, attemptId, ans.question_id]
    );
  }
  const [totalRow] = await db.execute(`SELECT total_questions FROM test_attempts WHERE id = ?`, [attemptId]);
  const total = totalRow[0]?.total_questions || 1;
  const score = (correctCount / total) * 100;
  await db.execute(
    `UPDATE test_attempts SET status = 'COMPLETED', score = ?, correct_count = ?, completed_at = NOW() WHERE id = ?`,
    [score, correctCount, attemptId]
  );
  return { score, correctCount, total };
};

// Kiểm tra xem attempt có tồn tại và thuộc về user không
const verifyAttemptOwnership = async (attemptId, userId) => {
  const [rows] = await db.execute(`SELECT id FROM test_attempts WHERE id = ? AND user_id = ?`, [attemptId, userId]);
  return rows.length > 0;
};

module.exports = {
  createAttempt,
  saveQuestionsAndOptions,
  getQuestionsByAttempt,
  saveAnswer,
  submitAttempt,
  verifyAttemptOwnership,
};