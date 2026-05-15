const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const AppError = require('../utils/appError');

exports.updateProfile = async (userId, updateData) => {
  const updated = await User.updateProfile(userId, updateData);
  if (!updated) throw new AppError(400, 'Cập nhật hồ sơ thất bại.', 'UPDATE_FAILED');
  
  return await User.findUserById(userId);
};

exports.changePassword = async (userId, oldPassword, newPassword) => {
  const user = await User.findUserByEmail((await User.findUserById(userId)).email);

  if (!(await bcrypt.compare(oldPassword, user.password_hash))) {
    throw new AppError(400, 'Mật khẩu cũ không chính xác.', 'AUTH_INVALID_OLD_PASSWORD');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await User.updatePassword(userId, hashedPassword);
};