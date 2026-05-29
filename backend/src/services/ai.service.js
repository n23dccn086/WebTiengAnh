const GeminiService = require('./gemini.service');
const UserModel = require('../models/user.model');
const AppError = require('../utils/appError');

const chat = async (user, message, chatHistory = []) => {
  // Kiểm tra quota (nếu không phải admin/super admin)
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    if (user.ai_quota <= 0) {
      throw new AppError(429, 'Bạn đã hết lượt hỏi AI hôm nay.', 'QUOTA_AI_EXCEEDED');
    }
  }

  const reply = await GeminiService.chatTutor(message, chatHistory);

  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    await UserModel.decrementAiQuota(user.id);
  }

  return { reply, remaining_quota: Math.max(0, user.ai_quota - 1) };
};

module.exports = { chat };