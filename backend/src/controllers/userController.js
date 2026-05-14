// controllers/userController.js

const bcrypt = require("bcryptjs");

const User = require("../models/user.model");

const { successResponse, errorResponse } = require("../utils/response.helper");

// =========================
// GET /api/v1/users/profile
// LẤY THÔNG TIN HỒ SƠ USER
// =========================
async function getProfile(req, res) {
  try {
    const user = await User.findUserById(req.user.id);

    if (!user) {
      return errorResponse(res, "Không tìm thấy user.", "USER_NOT_FOUND", 404);
    }

    return successResponse(res, "Lấy thông tin hồ sơ thành công", {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      dob: user.dob,
      phone: user.phone,
      role: user.role,
      status: user.status,
      premium_until: user.premium_until,
      ai_quota: user.ai_quota,
      is_reminder_enabled: Boolean(user.is_reminder_enabled),
    });
  } catch (error) {
    return errorResponse(
      res,
      "Lỗi server: " + error.message,
      "SERVER_ERROR",
      500,
    );
  }
}

// =========================
// PUT /api/v1/users/profile
// CẬP NHẬT HỒ SƠ USER
// Cho phép sửa: full_name, dob, phone
// =========================
async function updateProfile(req, res) {
  try {
    const { full_name, dob, phone } = req.body;

    if (!full_name && !dob && !phone) {
      return errorResponse(
        res,
        "Vui lòng nhập ít nhất một thông tin cần cập nhật.",
        "VALIDATION_ERROR",
        400,
      );
    }

    const updatedData = {
      full_name: full_name ? full_name.trim() : null,
      dob: dob || null,
      phone: phone ? phone.trim() : null,
    };

    const updated = await User.updateProfile(req.user.id, updatedData);

    if (!updated) {
      return errorResponse(
        res,
        "Cập nhật hồ sơ thất bại.",
        "USER_UPDATE_PROFILE_FAILED",
        400,
      );
    }

    const latestUser = await User.findUserById(req.user.id);

    return successResponse(res, "Cập nhật hồ sơ thành công", {
      full_name: latestUser.full_name,
      dob: latestUser.dob,
      phone: latestUser.phone,
    });
  } catch (error) {
    return errorResponse(
      res,
      "Lỗi server: " + error.message,
      "SERVER_ERROR",
      500,
    );
  }
}

// =========================
// PUT /api/v1/users/password
// ĐỔI MẬT KHẨU KHI ĐANG ĐĂNG NHẬP
// Body: { old_password, new_password }
// =========================
async function changePassword(req, res) {
  try {
    const { old_password, new_password } = req.body;

    if (!old_password || !new_password) {
      return errorResponse(
        res,
        "Vui lòng nhập mật khẩu cũ và mật khẩu mới.",
        "VALIDATION_ERROR",
        400,
      );
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{6,}$/;

    if (!passwordRegex.test(new_password)) {
      return errorResponse(
        res,
        "Mật khẩu mới phải có ít nhất 6 ký tự, 1 chữ hoa, 1 số và 1 ký tự đặc biệt.",
        "AUTH_PASSWORD_WEAK",
        400,
      );
    }

    // findUserByEmail có trả password_hash để bcrypt.compare()
    const user = await User.findUserByEmail(req.user.email);

    if (!user) {
      return errorResponse(res, "Không tìm thấy user.", "USER_NOT_FOUND", 404);
    }

    if (user.status === "BANNED") {
      return errorResponse(
        res,
        "Tài khoản đã bị khóa.",
        "AUTH_ACCOUNT_BANNED",
        403,
      );
    }

    const isOldPasswordCorrect = await bcrypt.compare(
      old_password,
      user.password_hash,
    );

    if (!isOldPasswordCorrect) {
      return errorResponse(
        res,
        "Mật khẩu cũ không chính xác.",
        "AUTH_INVALID_OLD_PASSWORD",
        400,
      );
    }

    const isSamePassword = await bcrypt.compare(
      new_password,
      user.password_hash,
    );

    if (isSamePassword) {
      return errorResponse(
        res,
        "Mật khẩu mới không được trùng với mật khẩu cũ.",
        "AUTH_NEW_PASSWORD_SAME_AS_OLD",
        400,
      );
    }

    const newPasswordHash = await bcrypt.hash(new_password, 10);

    await User.updatePassword(req.user.id, newPasswordHash);

    return successResponse(res, "Đổi mật khẩu thành công.", null, 200);
  } catch (error) {
    return errorResponse(
      res,
      "Lỗi server: " + error.message,
      "SERVER_ERROR",
      500,
    );
  }
}

// =========================
// PUT /api/v1/users/reminder
// BẬT / TẮT NHẮC HỌC
// Body: { is_reminder_enabled }
// =========================
async function updateReminderSetting(req, res) {
  try {
    const { is_reminder_enabled } = req.body;

    if (typeof is_reminder_enabled !== "boolean") {
      return errorResponse(
        res,
        "is_reminder_enabled phải là true hoặc false.",
        "VALIDATION_ERROR",
        400,
      );
    }

    const updated = await User.updateReminderSetting(
      req.user.id,
      is_reminder_enabled,
    );

    if (!updated) {
      return errorResponse(
        res,
        "Cập nhật cài đặt nhắc học thất bại.",
        "USER_UPDATE_REMINDER_FAILED",
        400,
      );
    }

    return successResponse(
      res,
      "Cập nhật cài đặt nhắc học thành công.",
      {
        is_reminder_enabled,
      },
      200,
    );
  } catch (error) {
    return errorResponse(
      res,
      "Lỗi server: " + error.message,
      "SERVER_ERROR",
      500,
    );
  }
}

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  updateReminderSetting,
};
