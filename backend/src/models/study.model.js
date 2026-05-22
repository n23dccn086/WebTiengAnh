const db = require('../config/database');

// --- TÍNH NĂNG RESUME TEST ---
const getInProgressAttempt = async (userId, setId) => {
  const [rows] = await db.execute(
    `SELECT id FROM test_attempts WHERE user_id = ? AND set_id = ? AND status = 'IN_PROGRESS' LIMIT 1`,
    [userId, setId]
  );
  return rows[0] || null;
};

const getTestQuestionsWithOptions = async (attemptId) => {
  const [questions] = await db.execute(
    `SELECT tq.id, tq.flashcard_id, tq.question_type, tq.content, ta.selected_option_id 
     FROM test_questions tq
     LEFT JOIN test_answers ta ON tq.id = ta.question_id 
     WHERE tq.attempt_id = ? ORDER BY tq.order_index ASC`,
    [attemptId]
  );

  for (let q of questions) {
    const [options] = await db.execute(
      `SELECT id, content FROM test_options WHERE question_id = ?`,
      [q.id]
    );
    q.options = options;
  }
  return questions;
};

// --- TẠO BÀI TEST MỚI (BỌC TRANSACTION) ---
const saveFullTestTransaction = async (userId, setId, questionsData) => {
  const connection = await db.getConnection();
  
  // Tái sử dụng "Bảo bối" bọc Promise đã hoạt động hoàn hảo ở API 1
  const execTx = (sql, params) => new Promise((res, rej) => connection.execute(sql, params, (err, results) => err ? rej(err) : res(results)));
  const beginTx = () => new Promise((res, rej) => connection.beginTransaction(err => err ? rej(err) : res()));
  const commitTx = () => new Promise((res, rej) => connection.commit(err => err ? rej(err) : res()));
  const rollbackTx = () => new Promise((res) => connection.rollback(() => res()));

  try {
    await beginTx();

    // Dùng execTx và KHÔNG dùng mảng [] (vì execTx trả về trực tiếp Object)
    const attemptResult = await execTx(
      `INSERT INTO test_attempts (user_id, set_id, total_questions, status) VALUES (?, ?, ?, 'IN_PROGRESS')`,
      [userId, setId, questionsData.length]
    );
    const attemptId = attemptResult.insertId;

    let orderIndex = 1;
    const frontendQuestions = [];

    for (const q of questionsData) {
      const qResult = await execTx(
        `INSERT INTO test_questions (attempt_id, flashcard_id, content, explanation, question_type, order_index) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [attemptId, q.flashcard_id, q.content, q.explanation, q.question_type, orderIndex++]
      );
      const questionId = qResult.insertId;

      const frontendOptions = [];
      for (const opt of q.options) {
        const optResult = await execTx(
          `INSERT INTO test_options (question_id, content, is_correct) VALUES (?, ?, ?)`,
          [questionId, opt.content, opt.is_correct]
        );
        frontendOptions.push({ id: optResult.insertId, content: opt.content });
      }

      frontendQuestions.push({
        id: questionId,
        flashcard_id: q.flashcard_id,
        question_type: q.question_type,
        content: q.content,
        options: frontendOptions
      });
    }

    await commitTx();
    return { attemptId, frontendQuestions };
  } catch (error) {
    await rollbackTx();
    throw error;
  } finally {
    connection.release();
  }
};

// --- LƯU NHÁP & NỘP BÀI ---
const saveTestAnswer = async (attemptId, questionId, selectedOptionId) => {
  await db.execute(
    `INSERT INTO test_answers (attempt_id, question_id, selected_option_id, answered_at) 
     VALUES (?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE selected_option_id = VALUES(selected_option_id), answered_at = NOW()`,
    [attemptId, questionId, selectedOptionId]
  );
  
  await db.execute(`UPDATE test_attempts SET last_saved_at = NOW() WHERE id = ?`, [attemptId]);
};

const getQuestionsForGrading = async (attemptId) => {
  const [rows] = await db.execute(
    `SELECT tq.id, tq.explanation, 
            ta.selected_option_id, 
            (SELECT id FROM test_options WHERE question_id = tq.id AND is_correct = TRUE LIMIT 1) AS correct_option_id
     FROM test_questions tq
     LEFT JOIN test_answers ta ON tq.id = ta.question_id AND ta.attempt_id = ?
     WHERE tq.attempt_id = ?`,
    [attemptId, attemptId]
  );
  return rows;
};

const updateTestScore = async (attemptId, correctCount, score) => {
  await db.execute(
    `UPDATE test_attempts 
     SET status = 'COMPLETED', correct_count = ?, score = ?, completed_at = NOW() 
     WHERE id = ?`,
    [correctCount, score, attemptId]
  );
};

// --- LỊCH SỬ ---
const getTestHistory = async (userId, setId) => {
  const [rows] = await db.execute(
    `SELECT id, score, total_questions, correct_count, started_at, completed_at, status 
     FROM test_attempts 
     WHERE user_id = ? AND set_id = ? 
     ORDER BY started_at DESC`,
    [userId, setId]
  );
  return rows;
};

module.exports = {
  getInProgressAttempt,
  getTestQuestionsWithOptions,
  saveFullTestTransaction,
  saveTestAnswer,
  getQuestionsForGrading,
  updateTestScore,
  getTestHistory
};