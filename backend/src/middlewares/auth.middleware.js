// File: src/middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');
const logger = require('../config/logger');
const User = require('../models/user.model');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// =========================
// 1. KIỂM TRA ĐĂNG NHẬP (protect)
// =========================
exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    logger.warn(`⚠️ Không có token - IP: ${req.ip} - URL: ${req.method} ${req.url}`);
    return next(new AppError(401, 'Bạn chưa đăng nhập. Vui lòng đăng nhập để truy cập.', 'AUTH_TOKEN_REQUIRED'));
  }

  // Giải mã Token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Gọi anh Thủ Kho (Model)
  const user = await User.findUserById(decoded.id);
  
  if (!user) {
    logger.warn(`❌ User không tồn tại - ID: ${decoded.id} - IP: ${req.ip}`);
    return next(new AppError(401, 'Token không hợp lệ hoặc user không tồn tại.', 'AUTH_INVALID_TOKEN'));
  }

  const displayName = user.full_name || user.email;

  // Kiểm tra trạng thái tài khoản
  if (user.status === 'BANNED') {
    logger.warn(`🚫 Tài khoản bị khóa: ${displayName} - IP: ${req.ip}`);
    return next(new AppError(403, 'Tài khoản đã bị khóa.', 'AUTH_ACCOUNT_BANNED'));
  }

  if (user.status === 'UNVERIFIED') {
    logger.warn(`⚠️ Tài khoản chưa xác thực: ${displayName} - IP: ${req.ip}`);
    return next(new AppError(403, 'Vui lòng xác thực email trước khi sử dụng hệ thống.', 'AUTH_EMAIL_NOT_VERIFIED'));
  }

  if (user.status !== 'ACTIVE') {
    return next(new AppError(403, 'Trạng thái tài khoản không hợp lệ.', 'AUTH_INVALID_STATUS'));
  }

  req.user = user;
  next();
});

// =========================
// 2. KIỂM TRA QUYỀN THEO ROLE (authorize)
// =========================
exports.authorize = (...roles) => {
  return (req, res, next) => {
    const displayName = req.user.full_name || req.user.email;

    if (!roles.includes(req.user.role)) {
      logger.warn(`🚨 CHẶN: ${displayName} (${req.user.role}) truy cập ${req.method} ${req.url}`);
      return next(new AppError(403, `Bạn không có quyền truy cập. Cần role: ${roles.join(', ')}`, 'AUTH_FORBIDDEN'));
    }

    next();
  };
};

// =========================
// 3. KIỂM TRA QUYỀN CHI TIẾT (checkPermission)
// =========================
exports.checkPermission = (permission) => {
  return catchAsync(async (req, res, next) => {
    
    // Gọi anh Thủ Kho (Model) để xử lý Database, Middleware sạch bóng SQL!
    const hasPermission = await User.checkRolePermission(req.user.role_id, permission);

    const displayName = req.user.full_name || req.user.email;

    if (!hasPermission) {
      logger.warn(`🚨 THIẾU QUYỀN: ${displayName} (${req.user.role}) - Cần quyền: ${permission}`);
      return next(new AppError(403, `Bạn không có quyền thực hiện hành động này.`, 'AUTH_PERMISSION_DENIED'));
    }

    next();
  });
};  