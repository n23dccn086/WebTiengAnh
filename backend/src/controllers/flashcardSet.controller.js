const FlashcardSetService = require('../services/flashcardSet.service');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { successResponse } = require('../utils/response.helper');

const getUserSets = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 12;
  const data = await FlashcardSetService.getUserSets(req.user.id, page, limit);
  return res.status(200).json({ status: "success", message: "Lấy danh sách bộ thẻ thành công", data });
});

const getSystemSets = catchAsync(async (req, res) => {
  const serviceId = req.query.service_id ? parseInt(req.query.service_id, 10) : null;
  const data = await FlashcardSetService.getSystemSets(req.user.id, serviceId);
  return successResponse(res, "Lấy danh sách bộ thẻ hệ thống thành công", data);
});

const getPersonalSets = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 12;
  const data = await FlashcardSetService.getPersonalSets(req.user.id, page, limit);
  return successResponse(res, "Lấy danh sách bộ thẻ cá nhân thành công", data);
});

const createSet = catchAsync(async (req, res) => {
  const { title, description } = req.body;
  
  // 🟢 FIX: Chuyển undefined thành null để MySQL không bị sập
  const service_id = req.body.service_id ? parseInt(req.body.service_id, 10) : null;
  
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
  const { is_srs_enabled, daily_new_words = 20, deleteFromLibrary = false } = req.body;
  await FlashcardSetService.toggleSrs(
    req.user.id,
    parseInt(req.params.id, 10),
    is_srs_enabled,
    daily_new_words,
    deleteFromLibrary
  );
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

const createSetFromPdf = catchAsync(async (req, res) => {
  if (!req.file) throw new AppError(400, 'Vui lòng đính kèm file PDF.', 'MISSING_PDF_FILE');
  let title = req.body.title || req.body.set_title;
  if (!title || !title.trim()) throw new AppError(400, 'Vui lòng nhập tên bộ thẻ.', 'MISSING_TITLE');
  title = title.trim();
  const description = req.body.description ? req.body.description.trim() : null;
  let service_id = req.body.service_id ? parseInt(req.body.service_id, 10) : nul;
  
  const result = await FlashcardSetService.createSetFromPdf(req.user, req.file.buffer, req.file.originalname, title, description, service_id);
  return res.status(201).json({ status: "success", message: "Trích xuất từ vựng từ PDF thành công", data: result });
});

const exportSet = catchAsync(async (req, res) => {
  const setId = parseInt(req.params.id, 10);
  const { format = 'csv' } = req.query;
  const data = await FlashcardSetService.exportSetToFile(setId, req.user.id, format);
  
  const filename = `flashcard_set_${setId}.${format === 'xlsx' ? 'xlsx' : 'csv'}`;
  const contentType = format === 'xlsx' 
    ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    : 'text/csv; charset=utf-8';
  
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', contentType);
  res.send(data);
});

const uploadPdfPreview = catchAsync(async (req, res) => {
  const { title, description, service_id } = req.body;
  if (!req.file) throw new AppError(400, 'Không tìm thấy file upload.', 'FILE_MISSING');
  const data = await FlashcardSetService.createSetFromPdfPreview(req.user, req.file.buffer, req.file.originalname, title, description, service_id);
  return res.status(200).json({ status: 'success', message: 'Trích xuất từ vựng thành công (Preview)', data });
});

module.exports = {
  uploadPdfPreview,
  getUserSets,
  getSystemSets,
  getPersonalSets,
  createSet,
  getSetDetail,
  updateSet,
  deleteSet,
  toggleSrs,
  saveSystemSet,
  exportSet,
  unsaveSystemSet,
  createSetFromPdf
};