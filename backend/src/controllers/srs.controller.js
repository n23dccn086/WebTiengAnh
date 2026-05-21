const srsService = require("../services/srs.service");
const { successResponse } = require("../utils/response.helper");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// GET /api/v1/srs/today
exports.getTodayReviews = catchAsync(async (req, res) => {
  const flashcards = await srsService.getDueFlashcards(req.user.id);
  successResponse(res, "Lấy danh sách ôn tập thành công", flashcards);
});

// POST /api/v1/srs/review
exports.submitReview = catchAsync(async (req, res) => {
  const { flashcard_id, rating } = req.body;
  if (!flashcard_id || !rating) {
    throw new AppError(400, "Thiếu flashcard_id hoặc rating", "MISSING_FIELDS");
  }
  await srsService.reviewFlashcard(req.user.id, flashcard_id, rating);
  successResponse(res, "Đã cập nhật tiến độ");
});

// POST /api/v1/srs/complete (tùy chọn: gọi khi kết thúc phiên để tăng streak)
exports.completeSession = catchAsync(async (req, res) => {
  const newStreak = await srsService.updateStreak(req.user.id);
  successResponse(res, "Hoàn thành phiên ôn tập", { streak: newStreak });
});