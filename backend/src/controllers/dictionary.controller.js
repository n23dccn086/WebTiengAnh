const { lookupWord } = require('../services/dictionary.service');
const { successResponse } = require('../utils/response.helper');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.autoFill = catchAsync(async (req, res) => {
  const { word } = req.body;
  if (!word) throw new AppError(400, 'Thiếu từ cần tra', 'MISSING_WORD');
  const result = await lookupWord(word);
  if (!result) {
    throw new AppError(404, 'Không tìm thấy từ này trong từ điển', 'WORD_NOT_FOUND');
  }
  successResponse(res, 'Lấy thông tin thành công', result);
});