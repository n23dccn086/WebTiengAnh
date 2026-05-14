// routes/userRoutes.js
const express = require("express");
const { body } = require("express-validator");

const router = express.Router();

const validate = require("../../middlewares/validate.middleware");
const userController = require("../../controllers/userController");
const { protect } = require("../../middlewares/auth.middleware");

// ==================== USER PROFILE API ====================

// GET /api/v1/users/profile
// Lấy thông tin hồ sơ cá nhân
router.get("/profile", protect, userController.getProfile);

// PUT /api/v1/users/profile
// Cập nhật hồ sơ cá nhân: full_name, dob, phone
router.put(
  "/profile",
  protect,
  [
    body("full_name")
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage("Họ và tên phải có ít nhất 2 ký tự"),

    body("dob")
      .optional()
      .isISO8601()
      .withMessage("Ngày sinh không hợp lệ. Định dạng đúng: YYYY-MM-DD"),

    body("phone")
      .optional()
      .trim()
      .isLength({ min: 9, max: 20 })
      .withMessage("Số điện thoại không hợp lệ"),
  ],
  validate,
  userController.updateProfile,
);

// PUT /api/v1/users/password
// Đổi mật khẩu khi user đang đăng nhập
router.put(
  "/password",
  protect,
  [
    body("old_password")
      .notEmpty()
      .withMessage("Mật khẩu cũ không được để trống"),

    body("new_password")
      .notEmpty()
      .withMessage("Mật khẩu mới không được để trống")
      .isLength({ min: 6 })
      .withMessage("Mật khẩu mới phải có ít nhất 6 ký tự")
      .matches(/[A-Z]/)
      .withMessage("Mật khẩu mới phải có ít nhất 1 chữ hoa")
      .matches(/[0-9]/)
      .withMessage("Mật khẩu mới phải có ít nhất 1 chữ số")
      .matches(/[!@#$%^&*(),.?":{}|<>]/)
      .withMessage("Mật khẩu mới phải có ít nhất 1 ký tự đặc biệt"),
  ],
  validate,
  userController.changePassword,
);

// PUT /api/v1/users/reminder
// Bật / tắt nhắc học
router.put(
  "/reminder",
  protect,
  [
    body("is_reminder_enabled")
      .isBoolean()
      .withMessage("is_reminder_enabled phải là true hoặc false"),
  ],
  validate,
  userController.updateReminderSetting,
);

module.exports = router;
