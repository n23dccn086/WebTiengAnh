const db = require('../config/database');
const catchAsync = require('../utils/catchAsync');
const { successResponse } = require('../utils/response.helper');

exports.getRandomWord = catchAsync(async (req, res) => {
  const [rows] = await db.query(
    `SELECT word, meaning, pronunciation, example_sentence 
     FROM flashcards 
     ORDER BY RAND() 
     LIMIT 1`
  );
  if (rows.length === 0) {
    return successResponse(res, 'Chưa có từ vựng nào trong hệ thống', null);
  }
  return successResponse(res, 'Lấy từ vựng ngẫu nhiên thành công', rows[0]);
});