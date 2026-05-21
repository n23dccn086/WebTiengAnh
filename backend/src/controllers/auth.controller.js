const authService = require('../services/auth.service');
const { successResponse } = require('../utils/response.helper');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const register = catchAsync(async (req, res) => {
  const { email, password, full_name } = req.body;
  await authService.register(email, password, full_name);
  return successResponse(res, 'Đăng ký thành công! Vui lòng kiểm tra hộp thư đến để xác nhận email.', null, 201);
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const data = await authService.login(email, password);
  return successResponse(res, 'Đăng nhập thành công', data);
});

const verifyEmail = catchAsync(async (req, res) => {
  const { token } = req.body;
  await authService.verifyEmail(token);
  return successResponse(res, 'Xác thực email thành công. Bạn đã có thể đăng nhập.');
});

const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  await authService.forgotPassword(email);
  return successResponse(res, 'Một đường link khôi phục mật khẩu đã được gửi đến email của bạn.');
});

const resetPassword = catchAsync(async (req, res) => {
  const { token, new_password } = req.body;
  await authService.resetPassword(token, new_password);
  return successResponse(res, 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.');
});

// File: src/controllers/auth.controller.js (hoặc file chứa code của bạn)

const logout = catchAsync(async (req, res) => {
  const refreshToken = req.body.refresh_token;
  
  // Nếu Frontend không gửi refresh_token (ví dụ: lỡ xóa mất trên LocalStorage), 
  // ta vẫn cứ trả về thành công để Frontend tự tin dọn dẹp nốt State và chuyển hướng về Login.
  if (refreshToken) {
    // CHỈ truyền 1 tham số là refreshToken, bỏ req.user.id đi
    await authService.logout(refreshToken);
  }
  
  // Trả về theo format API Contract: { status: "success", message: "...", data: null }
  return successResponse(res, 'Đăng xuất thành công');
});

const refreshToken = catchAsync(async (req, res) => {
  const { refresh_token } = req.body;
  
  if (!refresh_token) {
    throw new AppError(400, 'Thiếu refresh_token', 'MISSING_REFRESH_TOKEN');
  }
  
  const { accessToken } = await authService.refreshAccessToken(refresh_token);
  
  return successResponse(res, 'Cấp mới access token thành công', { accessToken });
});

module.exports = {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  logout,
  refreshToken,
};