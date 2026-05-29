const AdminService = require("../services/admin.service");
const catchAsync = require("../utils/catchAsync");
const { successResponse } = require("../utils/response.helper");
const AppError = require("../utils/appError");
const db = require("../config/database");

// ==========================================
// PHẦN B: ADMIN PANEL
// ==========================================
const getUsers = catchAsync(async (req, res) => {
  const { page, limit, search, status } = req.query;
  const data = await AdminService.getUsers(page, limit, search, status);
  return successResponse(res, "Lấy danh sách người dùng thành công", data);
});

const changeUserStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const data = await AdminService.changeUserStatus(id, status);
  return successResponse(res, "Cập nhật trạng thái người dùng thành công", data);
});

const changeUserRole = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  const data = await AdminService.changeUserRole(id, role);
  return successResponse(res, "Cập nhật phân quyền người dùng thành công", data);
});

// Service
const getServices = catchAsync(async (req, res) => {
  const services = await AdminService.getServices();
  return successResponse(res, "Lấy danh sách danh mục thành công", services);
});

const createService = catchAsync(async (req, res) => {
  const { title, description, status } = req.body;
  const data = await AdminService.createService(title, description, status);
  return successResponse(res, "Tạo service thành công", data, 201);
});

const updateService = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { title, description, status } = req.body;
  const data = await AdminService.updateService(id, title, description, status);
  return successResponse(res, "Cập nhật service thành công", data);
});

const updateServiceStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!["VISIBLE", "HIDDEN"].includes(status)) {
    throw new AppError(400, "Trạng thái không hợp lệ", "INVALID_STATUS");
  }
  await AdminService.updateServiceStatus(id, status);
  return successResponse(res, "Cập nhật trạng thái danh mục thành công", { id, status });
});

const deleteService = catchAsync(async (req, res) => {
  const { id } = req.params;
  const data = await AdminService.deleteService(id);
  return successResponse(res, "Xóa service thành công", data);
});

// System flashcard sets (tạo mới)
const createSystemFlashcardSet = catchAsync(async (req, res) => {
  const { title, description, service_id, flashcards } = req.body;
  const adminId = req.user.id;
  const data = await AdminService.createSystemFlashcardSet(adminId, service_id, title, description, flashcards);
  return successResponse(res, "Tạo bộ thẻ hệ thống thành công", data, 201);
});

const importSystemFlashcardSet = catchAsync(async (req, res) => {
  if (!req.file) throw new AppError(400, "Vui lòng upload file Excel/CSV", "MISSING_FILE");
  const { title, description, service_id } = req.body;
  if (!title || !service_id) throw new AppError(400, "Thiếu tên bộ thẻ hoặc service_id", "MISSING_FIELDS");
  const data = await AdminService.importSystemFlashcardSet(
    req.user.id,
    req.file.buffer,
    title,
    parseInt(service_id),
    description
  );
  return successResponse(res, "Import bộ thẻ hệ thống thành công", data, 201);
});

// Transactions
const getTransactions = catchAsync(async (req, res) => {
  const { page, limit, status } = req.query;
  const data = await AdminService.getTransactions(page, limit, status);
  return successResponse(res, "Lấy danh sách giao dịch thành công", data);
});

// ==========================================
// PHẦN C: SUPER ADMIN
// ==========================================
const createStaff = catchAsync(async (req, res) => {
  const { email, full_name, password } = req.body;
  const data = await AdminService.createStaff(email, full_name, password);
  return successResponse(res, "Tạo tài khoản Admin thành công", data, 201);
});

const deleteStaff = catchAsync(async (req, res) => {
  const { id } = req.params;
  const superAdminId = req.user.id;
  const data = await AdminService.deleteStaff(superAdminId, id);
  return successResponse(res, "Xóa tài khoản Admin thành công", data);
});

const resetStaffPassword = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { new_password } = req.body;
  const data = await AdminService.resetStaffPassword(id, new_password);
  return successResponse(res, "Đặt lại mật khẩu Admin thành công", data);
});

// ==========================================
// QUẢN LÝ BỘ THẺ HỆ THỐNG
// ==========================================
const getSystemSets = catchAsync(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const safeLimit = parseInt(limit, 10);
  const safeOffset = parseInt(offset, 10);
  
  // Dùng db.query (hoặc db.execute) nhưng đảm bảo số tham số khớp
  const [rows] = await db.query(
    `SELECT id, title, description, service_id, created_at
     FROM flashcard_sets
     WHERE is_system = TRUE
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [safeLimit, safeOffset]
  );
  
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) as total FROM flashcard_sets WHERE is_system = TRUE`
  );
  
  const sets = await Promise.all(rows.map(async (set) => {
    const [[{ count }]] = await db.query(
      `SELECT COUNT(*) as count FROM flashcards WHERE set_id = ?`,
      [set.id]
    );
    return {
      id: set.id,
      title: set.title,
      description: set.description,
      service_id: set.service_id,
      total_cards: count,
      created_at: set.created_at
    };
  }));
  
  return successResponse(res, 'Lấy danh sách bộ thẻ hệ thống thành công', {
    sets,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      totalItems: total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

const updateSystemSet = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;
  if (!title) throw new AppError(400, 'Tiêu đề không được để trống');
  
  await db.execute(
    `UPDATE flashcard_sets SET title = ?, description = ? WHERE id = ? AND is_system = TRUE`,
    [title, description || null, id]
  );
  return successResponse(res, 'Cập nhật bộ thẻ thành công');
});

const deleteSystemSet = catchAsync(async (req, res) => {
  console.log('🔍 Delete system set ID:', req.params.id);
  const { id } = req.params;
  await db.execute(`DELETE FROM flashcard_sets WHERE id = ? AND is_system = TRUE`, [id]);
  return successResponse(res, 'Xóa bộ thẻ thành công');
});

module.exports = {
  getUsers,
  changeUserStatus,
  changeUserRole,
  getServices,
  createService,
  updateService,
  updateServiceStatus,
  deleteService,
  createSystemFlashcardSet,
  importSystemFlashcardSet,
  getTransactions,
  createStaff,
  deleteStaff,
  resetStaffPassword,
  getSystemSets,
  updateSystemSet,
  deleteSystemSet,
};