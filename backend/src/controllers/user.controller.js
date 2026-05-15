// File: src/controllers/user.controller.js
const userService = require('../services/user.service');
const { successResponse } = require('../utils/response.helper');
const catchAsync = require('../utils/catchAsync');

exports.getProfile = catchAsync(async (req, res) => {
  // Thông tin user đã được auth.middleware.js nạp sẵn vào req.user
  return successResponse(res, 'Lấy thông tin hồ sơ thành công', req.user);
});

exports.updateProfile = catchAsync(async (req, res) => {
  const updatedUser = await userService.updateProfile(req.user.id, req.body);
  
  return successResponse(res, 'Cập nhật hồ sơ thành công', {
    full_name: updatedUser.full_name,
    dob: updatedUser.dob,
    phone: updatedUser.phone
  });
});

exports.changePassword = catchAsync(async (req, res) => {
  const { old_password, new_password } = req.body;
  await userService.changePassword(req.user.id, old_password, new_password);
  
  return successResponse(res, 'Đổi mật khẩu thành công.');
});