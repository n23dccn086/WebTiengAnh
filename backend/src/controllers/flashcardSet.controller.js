const flashcardSetModel = require("../models/flashcardSet.model");
const flashcardModel = require("../models/flashcard.model");
const { successResponse } = require("../utils/response.helper");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.getUserSets = catchAsync(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const data = await flashcardSetModel.getSetsByUser(req.user.id, { page, limit });
  successResponse(res, "Lấy danh sách bộ thẻ thành công", data.sets, 200, { total: data.total, page, limit });
});

exports.getSetDetail = catchAsync(async (req, res) => {
  const setId = parseInt(req.params.id);
  const set = await flashcardSetModel.getSetById(setId, req.user.id);
  if (!set) throw new AppError(404, "Bộ thẻ không tồn tại hoặc không thuộc quyền sở hữu", "SET_NOT_FOUND");
  const flashcards = await flashcardModel.getFlashcardsBySet(setId);
  set.flashcards = flashcards;
  successResponse(res, "Lấy chi tiết bộ thẻ thành công", set);
});

exports.createSet = catchAsync(async (req, res) => {
  const { service_id, title, description } = req.body;
  if (!service_id || !title) throw new AppError(400, "Thiếu service_id hoặc title", "MISSING_FIELDS");
  const newSet = await flashcardSetModel.createSet({
    user_id: req.user.id,
    service_id,
    title,
    description,
    is_system: false,
  });
  successResponse(res, "Tạo bộ thẻ thành công", newSet, 201);
});

exports.updateSet = catchAsync(async (req, res) => {
  const setId = parseInt(req.params.id);
  const { title, description } = req.body;
  const updated = await flashcardSetModel.updateSet(setId, { title, description });
  if (!updated) throw new AppError(400, "Cập nhật thất bại", "UPDATE_FAILED");
  successResponse(res, "Cập nhật bộ thẻ thành công");
});

exports.deleteSet = catchAsync(async (req, res) => {
  const setId = parseInt(req.params.id);
  const deleted = await flashcardSetModel.deleteSet(setId, req.user.id);
  if (!deleted) throw new AppError(404, "Không tìm thấy bộ thẻ hoặc không thể xóa", "DELETE_FAILED");
  successResponse(res, "Xóa bộ thẻ thành công");
});

exports.toggleSrs = catchAsync(async (req, res) => {
  const setId = parseInt(req.params.id);
  const { is_srs_enabled, daily_new_words } = req.body;
  await flashcardSetModel.toggleSrs(req.user.id, setId, is_srs_enabled, daily_new_words);
  successResponse(res, `Đã ${is_srs_enabled ? "bật" : "tắt"} chế độ SRS`);
});

exports.getSetSettings = catchAsync(async (req, res) => {
  const setId = parseInt(req.params.id);
  const settings = await flashcardSetModel.getSetSettings(req.user.id, setId);
  successResponse(res, "Lấy cài đặt SRS thành công", settings);
});