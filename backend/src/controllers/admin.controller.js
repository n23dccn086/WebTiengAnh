const AdminService = require('../services/admin.service');
const catchAsync = require('../utils/catchAsync');
const { successResponse } = require('../utils/response.helper');

// ==========================================
// PHẦN B: ADMIN PANEL (Quản lý User, Service, Thẻ)
// ==========================================

const getUsers = catchAsync(async (req, res) => {
  const { page, limit, search, status } = req.query;
  const data = await AdminService.getUsers(page, limit, search, status);
  return successResponse(res, 'Lấy danh sách người dùng thành công', data);
});

const changeUserStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const data = await AdminService.changeUserStatus(id, status);
  return successResponse(res, 'Cập nhật trạng thái người dùng thành công', data);
});

const changeUserRole = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  const data = await AdminService.changeUserRole(id, role);
  return successResponse(res, 'Cập nhật phân quyền người dùng thành công', data);
});

const createService = catchAsync(async (req, res) => {
  const { title, description, status } = req.body;
  const data = await AdminService.createService(title, description, status);
  return successResponse(res, 'Tạo service thành công', data, 201);
});

const updateService = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { title, description, status } = req.body;
  const data = await AdminService.updateService(id, title, description, status);
  return successResponse(res, 'Cập nhật service thành công', data);
});

const deleteService = catchAsync(async (req, res) => {
  const { id } = req.params;
  const data = await AdminService.deleteService(id);
  return successResponse(res, 'Xóa service thành công', data);
});

const createSystemFlashcardSet = catchAsync(async (req, res) => {
  const { title, service_id, flashcards } = req.body;
  const adminId = req.user.id; // Lấy ID của Admin đang login
  
  const data = await AdminService.createSystemFlashcardSet(adminId, service_id, title, flashcards);
  return successResponse(res, 'Tạo bộ thẻ hệ thống thành công', data, 201);
});

const getTransactions = catchAsync(async (req, res) => {
  const { page, limit, status } = req.query;
  const data = await AdminService.getTransactions(page, limit, status);
  return successResponse(res, 'Lấy danh sách giao dịch thành công', data);
});

// ==========================================
// PHẦN C: SUPER ADMIN (Quản lý Staff)
// ==========================================

const createStaff = catchAsync(async (req, res) => {
  const { email, full_name, password } = req.body;
  const data = await AdminService.createStaff(email, full_name, password);
  return successResponse(res, 'Tạo tài khoản Admin thành công', data, 201);
});

const deleteStaff = catchAsync(async (req, res) => {
  const { id } = req.params;
  const superAdminId = req.user.id;
  const data = await AdminService.deleteStaff(superAdminId, id);
  return successResponse(res, 'Xóa tài khoản Admin thành công', data);
});

const resetStaffPassword = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { new_password } = req.body;
  const data = await AdminService.resetStaffPassword(id, new_password);
  return successResponse(res, 'Đặt lại mật khẩu Admin thành công', data);
});

module.exports = {
  getUsers,
  changeUserStatus,
  changeUserRole,
  createService,
  updateService,
  deleteService,
  createSystemFlashcardSet,
  getTransactions,
  createStaff,
  deleteStaff,
  resetStaffPassword
};