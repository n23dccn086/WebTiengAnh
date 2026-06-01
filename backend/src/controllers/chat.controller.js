const ChatService = require('../services/chat.service');
const catchAsync = require('../utils/catchAsync');
const { successResponse } = require('../utils/response.helper');
const AppError = require('../utils/appError');

const sendMessage = catchAsync(async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) throw new AppError(400, 'Tin nhắn không được để trống');
  const userName = req.user.full_name || req.user.email.split('@')[0];
  const result = await ChatService.sendMessage(req.user.id, userName, req.user.role, message);
  return successResponse(res, 'Gửi tin nhắn thành công', result);
});

const getMessages = catchAsync(async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const messages = await ChatService.getMessages(limit);
  return successResponse(res, 'Lấy tin nhắn thành công', messages);
});

module.exports = { sendMessage, getMessages };