const db = require('../config/database');
const catchAsync = require('../utils/catchAsync');
const { successResponse } = require('../utils/response.helper');
const AppError = require('../utils/appError');

exports.getQuizzes = catchAsync(async (req, res) => {
  const { service_id } = req.query;
  let sql = `SELECT id, title, description, service_id, total_questions FROM static_quizzes WHERE 1=1`;
  const params = [];
  if (service_id) {
    sql += ` AND service_id = ?`;
    params.push(service_id);
  }
  sql += ` ORDER BY created_at DESC`;
  const [rows] = await db.execute(sql, params);
  successResponse(res, 'Lấy danh sách bộ đề thành công', rows);
});

exports.getQuizDetail = catchAsync(async (req, res) => {
  const quizId = req.params.id;
  // Lấy thông tin quiz
  const [quizRows] = await db.execute(`SELECT * FROM static_quizzes WHERE id = ?`, [quizId]);
  if (quizRows.length === 0) throw new AppError(404, 'Không tìm thấy bộ đề', 'QUIZ_NOT_FOUND');
  const quiz = quizRows[0];

  // Lấy câu hỏi + options
  const [questions] = await db.execute(`
    SELECT q.id, q.content, q.explanation, q.question_type,
           JSON_ARRAYAGG(JSON_OBJECT('id', o.id, 'content', o.content, 'is_correct', o.is_correct)) as options
    FROM static_questions q
    LEFT JOIN static_options o ON q.id = o.question_id
    WHERE q.quiz_id = ?
    GROUP BY q.id
    ORDER BY q.id
  `, [quizId]);

  quiz.questions = questions;
  successResponse(res, 'Lấy chi tiết bộ đề thành công', quiz);
});