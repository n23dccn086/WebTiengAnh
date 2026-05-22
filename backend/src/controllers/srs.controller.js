const SrsService = require('../services/srs.service');
const catchAsync = require('../utils/catchAsync');
const { successResponse } = require('../utils/response.helper');

const getTodayCards = catchAsync(async (req, res) => {
  const data = await SrsService.getTodayCards(req.user.id);
  return successResponse(res, "Lấy danh sách từ vựng ôn tập hôm nay thành công", data);
});

const reviewCard = catchAsync(async (req, res) => {
  const { flashcard_id, rating } = req.body;
  const data = await SrsService.reviewCard(req.user.id, flashcard_id, rating);
  return successResponse(res, "Cập nhật tiến độ học thành công", data);
});

const startLearning = catchAsync(async (req, res) => {
  // Mặc định kéo 20 từ mới khi nhấn Bắt đầu
  const data = await SrsService.learnNewCards(req.user.id, 20);
  return successResponse(res, data.message, { added_count: data.added_count });
});

const learnMoreNewCards = catchAsync(async (req, res) => {
  const limit = req.body.limit || 20;
  const data = await SrsService.learnNewCards(req.user.id, limit);
  return successResponse(res, data.message, { added_count: data.added_count });
});

module.exports = {
  getTodayCards,
  reviewCard,
  startLearning,
  learnMoreNewCards
};