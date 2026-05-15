// File: src/controllers/auth.controller.js

const authService = require('../services/auth.service');
const { successResponse } = require('../utils/response.helper');
const catchAsync = require('../utils/catchAsync');

// =========================
// ĐĂNG KÝ
// =========================
const register = catchAsync(async (req, res) => {
  const { email, password, full_name } = req.body;
  
  await authService.register(email, password, full_name);
  
  return successResponse(res, 'Đăng ký thành công! Vui lòng kiểm tra hộp thư đến để xác nhận email.', null, 201);
});

// =========================
// ĐĂNG NHẬP
// =========================
const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  
  const data = await authService.login(email, password);
  
  return successResponse(res, 'Đăng nhập thành công', data);
});

// =========================
// XÁC THỰC EMAIL
// =========================
const verifyEmail = catchAsync(async (req, res) => {
  const { token } = req.body;
  
  await authService.verifyEmail(token);
  
  return successResponse(res, 'Xác thực email thành công. Bạn đã có thể đăng nhập.');
});

// =========================
// QUÊN MẬT KHẨU
// =========================
const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  
  await authService.forgotPassword(email);
  
  return successResponse(res, 'Một đường link khôi phục mật khẩu đã được gửi đến email của bạn.');
});

// =========================
// ĐẶT LẠI MẬT KHẨU
// =========================
const resetPassword = catchAsync(async (req, res) => {
  const { token, new_password } = req.body;
  
  await authService.resetPassword(token, new_password);
  
  return successResponse(res, 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.');
});

module.exports = {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword
};