const AiService = require('../services/ai.service');
const catchAsync = require('../utils/catchAsync');
const { successResponse } = require('../utils/response.helper');
const AppError = require('../utils/appError');

const freeChat = catchAsync(async (req, res) => {
  const { message, chat_history } = req.body;
  if (!message) throw new AppError(400, 'Thiếu nội dung tin nhắn');
  const data = await AiService.chat(req.user, message, chat_history || []);
  return successResponse(res, 'OK', data);
});

module.exports = { freeChat };