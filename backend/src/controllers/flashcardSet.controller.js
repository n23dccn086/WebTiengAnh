const FlashcardSetService = require('../services/flashcardSet.service');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { successResponse } = require('../utils/response.helper');

// --- [CÁC API CỦA SPRINT 2] ---
const getUserSets = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 12;
  const data = await FlashcardSetService.getUserSets(req.user.id, page, limit);
  
  return res.status(200).json({
    status: "success",
    message: "Lấy danh sách bộ thẻ thành công",
    data: data
  });
});

const getSystemSets = catchAsync(async (req, res) => {
  const data = await FlashcardSetService.getSystemSets(req.user.id);
  return successResponse(res, "Lấy danh sách bộ thẻ hệ thống thành công", data);
});

const createSet = catchAsync(async (req, res) => {
  const { title, description, service_id } = req.body;
  const newSet = await FlashcardSetService.createSet(req.user.id, title, description, service_id);
  return res.status(201).json({ status: "success", message: "Tạo bộ thẻ thành công", data: newSet });
});

const getSetDetail = catchAsync(async (req, res) => {
  const data = await FlashcardSetService.getSetDetail(parseInt(req.params.id, 10), req.user.id);
  return successResponse(res, "Lấy chi tiết bộ thẻ thành công", data);
});

const updateSet = catchAsync(async (req, res) => {
  const { title, description } = req.body;
  await FlashcardSetService.updateSet(parseInt(req.params.id, 10), req.user.id, title, description);
  return successResponse(res, "Cập nhật bộ thẻ thành công");
});

const deleteSet = catchAsync(async (req, res) => {
  await FlashcardSetService.deleteSet(parseInt(req.params.id, 10), req.user.id);
  return successResponse(res, "Xóa bộ thẻ thành công");
});

const toggleSrs = catchAsync(async (req, res) => {
  const { is_srs_enabled, daily_new_words = 20 } = req.body;
  await FlashcardSetService.toggleSrs(req.user.id, parseInt(req.params.id, 10), is_srs_enabled, daily_new_words);
  return successResponse(res, `Đã ${is_srs_enabled ? 'bật' : 'tắt'} chế độ ôn tập SRS`);
});

const saveSystemSet = catchAsync(async (req, res) => {
  await FlashcardSetService.saveSystemSet(req.user.id, parseInt(req.params.id, 10), 'SAVE');
  return successResponse(res, "Đã lưu bộ thẻ hệ thống");
});

const unsaveSystemSet = catchAsync(async (req, res) => {
  await FlashcardSetService.saveSystemSet(req.user.id, parseInt(req.params.id, 10), 'UNSAVE');
  return successResponse(res, "Đã bỏ lưu bộ thẻ hệ thống");
});

// --- [API MỚI CỦA SPRINT 3] ---
const createSetFromPdf = catchAsync(async (req, res) => {
  // Kiểm tra xem user có đính kèm file chưa
  if (!req.file) {
    throw new AppError(400, 'Vui lòng đính kèm file PDF.', 'MISSING_PDF_FILE');
  }

  const { title, service_id } = req.body;
  
  // Validate cơ bản (Vì form-data thỉnh thoảng khó dùng chung với Joi nên ta check tay cho chắc)
  if (!title || !title.trim()) throw new AppError(400, 'Vui lòng nhập tên bộ thẻ.', 'MISSING_TITLE');
  if (!service_id) throw new AppError(400, 'Vui lòng chọn danh mục.', 'MISSING_SERVICE_ID');

  const result = await FlashcardSetService.createSetFromPdf(
    req.user,
    req.file.buffer,         // File nằm trên RAM do Multer xử lý
    req.file.originalname,   // Tên gốc của file PDF
    title.trim(),
    parseInt(service_id, 10)
  );

  return res.status(201).json({
    status: "success",
    message: "Trích xuất từ vựng từ PDF thành công",
    data: result
  });
});

module.exports = {
  getUserSets, getSystemSets, createSet, getSetDetail,
  updateSet, deleteSet, toggleSrs, saveSystemSet, unsaveSystemSet,
  createSetFromPdf // Export hàm mới ra
};