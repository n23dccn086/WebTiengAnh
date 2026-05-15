// File: src/services/auth.service.js

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const User = require('../models/user.model');
const AppError = require('../utils/appError');
const { sendVerificationEmail, sendResetPasswordEmail } = require('../config/email');

// =========================
// HÀM TIỆN ÍCH: TẠO ACCESS TOKEN
// =========================
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role, role_id: user.role_id },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// =========================
// 1. NGHIỆP VỤ ĐĂNG KÝ
// =========================
const register = async (email, password, full_name) => {
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Kiểm tra email tồn tại chưa (Anh Thủ Kho User làm)
  const existingUser = await User.findUserByEmail(normalizedEmail);
  if (existingUser) {
    throw new AppError(400, 'Email đã được đăng ký.', 'AUTH_EMAIL_EXISTS');
  }

  // 2. Băm mật khẩu
  const passwordHash = await bcrypt.hash(password, 10);

  // 3. Lưu User mới
  const newUser = await User.createUser({
    email: normalizedEmail,
    full_name: full_name.trim(),
    password_hash: passwordHash,
    role_id: User.ROLE_IDS.USER,
    status: 'UNVERIFIED',
  });

  // 4. Tạo token xác thực Email
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // Hết hạn sau 15p

  await User.deleteUserTokensByType(newUser.id, 'VERIFY_EMAIL');
  await User.createUserToken(newUser.id, verificationToken, 'VERIFY_EMAIL', expiresAt);

  // 5. Gửi email
  await sendVerificationEmail(normalizedEmail, verificationToken);

  return newUser; // Trả dữ liệu về cho Controller
};

// =========================
// 2. NGHIỆP VỤ ĐĂNG NHẬP
// =========================
const login = async (email, password) => {
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Lấy user từ DB
  const user = await User.findUserByEmail(normalizedEmail);

  // 2. Kiểm tra tồn tại và so khớp mật khẩu
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new AppError(401, 'Email hoặc mật khẩu không chính xác.', 'AUTH_INVALID_CREDENTIALS');
  }

  // 3. Kiểm tra trạng thái tài khoản
  if (user.status === 'UNVERIFIED') {
    throw new AppError(403, 'Vui lòng xác thực email trước khi đăng nhập.', 'AUTH_EMAIL_NOT_VERIFIED');
  }
  if (user.status === 'BANNED') {
    throw new AppError(403, 'Tài khoản đã bị khóa.', 'AUTH_ACCOUNT_BANNED');
  }

  // 4. Cấp JWT Token
  const accessToken = generateAccessToken(user);

  // 5. Trả về cho Controller
  return {
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    }
  };
};

// =========================
// 3. NGHIỆP VỤ XÁC THỰC EMAIL
// =========================
const verifyEmail = async (token) => {
  const user = await User.findUserByToken(token, 'VERIFY_EMAIL');

  if (!user) {
    throw new AppError(400, 'Đường dẫn xác thực không hợp lệ hoặc đã hết hạn.', 'AUTH_INVALID_TOKEN');
  }

  if (user.status === 'BANNED') {
    throw new AppError(403, 'Tài khoản đã bị khóa, không thể xác thực.', 'AUTH_ACCOUNT_BANNED');
  }

  await User.activateUser(user.id);
  await User.deleteUserToken(token, 'VERIFY_EMAIL');
};

// =========================
// 4. NGHIỆP VỤ QUÊN MẬT KHẨU
// =========================
const forgotPassword = async (email) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findUserByEmail(normalizedEmail);

  // Bảo mật: Không ném lỗi nếu email không tồn tại để hacker không dò được email của hệ thống
  if (!user || user.status === 'BANNED') return;

  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await User.deleteUserTokensByType(user.id, 'RESET_PASSWORD');
  await User.createUserToken(user.id, resetToken, 'RESET_PASSWORD', expiresAt);
  await sendResetPasswordEmail(normalizedEmail, resetToken);
};

// =========================
// 5. NGHIỆP VỤ ĐẶT LẠI MẬT KHẨU
// =========================
const resetPassword = async (token, newPassword) => {
  const user = await User.findUserByToken(token, 'RESET_PASSWORD');

  if (!user) {
    throw new AppError(400, 'Đường dẫn đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.', 'AUTH_INVALID_TOKEN');
  }
  if (user.status === 'BANNED') {
    throw new AppError(403, 'Tài khoản đã bị khóa, không thể đặt lại mật khẩu.', 'AUTH_ACCOUNT_BANNED');
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await User.updatePassword(user.id, passwordHash);
  await User.deleteUserToken(token, 'RESET_PASSWORD');
};

module.exports = { 
  register, 
  login, 
  verifyEmail, 
  forgotPassword, 
  resetPassword 
};