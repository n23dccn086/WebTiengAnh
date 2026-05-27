const userService = require('../services/user.service');
const { successResponse } = require('../utils/response.helper');
const catchAsync = require('../utils/catchAsync');
const db = require('../config/database'); // ✅ Thêm dòng này để dùng db.execute

exports.getProfile = catchAsync(async (req, res) => {
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

exports.updateReminder = catchAsync(async (req, res) => {
  const { is_enabled } = req.body;
  await userService.updateReminder(req.user.id, is_enabled);
  return successResponse(res, 'Cập nhật cài đặt nhắc nhở thành công');
});

// ✅ API lấy thống kê cho Dashboard
exports.getDashboardStats = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const [[{ totalLearned }]] = await db.execute(
    `SELECT COUNT(*) as totalLearned FROM user_flashcards WHERE user_id = ? AND (last_reviewed_at IS NOT NULL OR repetition_count > 0)`,
    [userId]
  );
  const [[{ totalQuizzes }]] = await db.execute(
    `SELECT COUNT(*) as totalQuizzes FROM test_attempts WHERE user_id = ? AND status = 'COMPLETED'`,
    [userId]
  );
  const [[{ avgScore }]] = await db.execute(
    `SELECT AVG(score) as avgScore FROM test_attempts WHERE user_id = ? AND status = 'COMPLETED' AND score IS NOT NULL`,
    [userId]
  );
  return successResponse(res, 'Lấy thống kê thành công', {
    totalLearned: totalLearned || 0,
    totalQuizzes: totalQuizzes || 0,
    averageScore: Math.round(avgScore || 0)
  });
});