const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const User = require('../models/user.model');
const AppError = require('../utils/appError');
const { sendVerificationEmail, sendResetPasswordEmail } = require('../config/email');

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role, role_id: user.role_id },
    process.env.JWT_SECRET, // Xài đúng biến JWT_SECRET trong .env của team
    { expiresIn: '1h' }     // Vẫn giữ 1 tiếng để đảm bảo an toàn nha
  );
};

const generateRefreshToken = (userId) => {
  const refreshToken = crypto.randomBytes(64).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Sống 7 ngày
  return { refreshToken, expiresAt };
};

const storeRefreshToken = async (userId, token, expiresAt) => {
  await User.deleteUserTokensByType(userId, 'REFRESH_TOKEN');
  await User.createUserToken(userId, token, 'REFRESH_TOKEN', expiresAt);
};

const register = async (email, password, full_name) => {
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await User.findUserByEmail(normalizedEmail);
  if (existingUser) {
    throw new AppError(400, 'Email đã được đăng ký.', 'AUTH_EMAIL_EXISTS');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = await User.createUser({
    email: normalizedEmail,
    full_name: full_name.trim(),
    password_hash: passwordHash,
    role_id: User.ROLE_IDS.USER,
    status: 'UNVERIFIED',
  });

  const verificationToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

  await User.deleteUserTokensByType(newUser.id, 'VERIFY_EMAIL');
  await User.createUserToken(newUser.id, verificationToken, 'VERIFY_EMAIL', expiresAt);
  await sendVerificationEmail(normalizedEmail, verificationToken);

  return newUser;
};

const login = async (email, password) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findUserByEmail(normalizedEmail);

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new AppError(401, 'Email hoặc mật khẩu không chính xác.', 'AUTH_INVALID_CREDENTIALS');
  }

  if (user.status === 'UNVERIFIED') {
    throw new AppError(403, 'Vui lòng xác thực email trước khi đăng nhập.', 'AUTH_EMAIL_NOT_VERIFIED');
  }
  if (user.status === 'BANNED') {
    throw new AppError(403, 'Tài khoản đã bị khóa.', 'AUTH_ACCOUNT_BANNED');
  }

  const accessToken = generateAccessToken(user);
  const { refreshToken, expiresAt } = generateRefreshToken(user.id);
  await storeRefreshToken(user.id, refreshToken, expiresAt);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    }
  };
};

const verifyEmail = async (token) => {
  // SỬA: Dùng hàm findTokenRecord mới
  const tokenRecord = await User.findTokenRecord(token, 'VERIFY_EMAIL');
  if (!tokenRecord) {
    throw new AppError(400, 'Đường dẫn xác thực không hợp lệ hoặc đã hết hạn.', 'AUTH_INVALID_TOKEN');
  }

  const user = await User.findUserById(tokenRecord.user_id);
  if (user && user.status === 'BANNED') {
    throw new AppError(403, 'Tài khoản đã bị khóa, không thể xác thực.', 'AUTH_ACCOUNT_BANNED');
  }

  await User.activateUser(tokenRecord.user_id);
  // SỬA: Dùng hàm deleteToken mới
  await User.deleteToken(token);
  return true;
};

const forgotPassword = async (email) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findUserByEmail(normalizedEmail);
  if (!user || user.status === 'BANNED') return;

  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 phút
  
  await User.deleteUserTokensByType(user.id, 'RESET_PASSWORD');
  await User.createUserToken(user.id, resetToken, 'RESET_PASSWORD', expiresAt);
  await sendResetPasswordEmail(normalizedEmail, resetToken);
};

const resetPassword = async (token, newPassword) => {
  // SỬA: Dùng hàm findTokenRecord mới
  const tokenRecord = await User.findTokenRecord(token, 'RESET_PASSWORD');
  if (!tokenRecord) {
    throw new AppError(400, 'Đường dẫn đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.', 'AUTH_INVALID_TOKEN');
  }

  const user = await User.findUserById(tokenRecord.user_id);
  if (user && user.status === 'BANNED') {
    throw new AppError(403, 'Tài khoản đã bị khóa, không thể đặt lại mật khẩu.', 'AUTH_ACCOUNT_BANNED');
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await User.updatePassword(tokenRecord.user_id, passwordHash);
  // SỬA: Dùng hàm deleteToken mới
  await User.deleteToken(token);
  return true;
};

const logout = async (refreshToken) => {
  if (refreshToken) {
    await User.deleteRefreshToken(refreshToken);
  }
  return true; 
};

const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new AppError(401, 'Không tìm thấy Refresh Token', 'TOKEN_MISSING');
  }

  const tokenRecord = await User.findRefreshToken(refreshToken);
  
  if (!tokenRecord) {
    throw new AppError(401, 'Refresh token không hợp lệ hoặc đã hết hạn', 'INVALID_REFRESH_TOKEN');
  }

  const user = await User.findUserById(tokenRecord.user_id);
  
  if (!user || user.status !== 'ACTIVE') {
    throw new AppError(403, 'Tài khoản không hợp lệ hoặc đã bị khóa', 'USER_INVALID');
  }

  const accessToken = generateAccessToken({ id: user.id, role: user.role, role_id: user.role_id }); 
  
  return { accessToken };
};

module.exports = {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  logout,
  refreshAccessToken,
};