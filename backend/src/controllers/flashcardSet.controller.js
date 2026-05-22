const FlashcardSetService = require('../services/flashcardSet.service');
const catchAsync = require('../utils/catchAsync');
const { successResponse } = require('../utils/response.helper');

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

module.exports = {
  getUserSets, getSystemSets, createSet, getSetDetail,
  updateSet, deleteSet, toggleSrs, saveSystemSet, unsaveSystemSet
};