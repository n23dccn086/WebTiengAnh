// routes/authRoutes.js
const express = require("express");
const { body, param } = require("express-validator");

const router = express.Router();

const validate = require("../../middlewares/validate.middleware");
const authController = require("../../controllers/authController");
const { protect, authorize } = require("../../middlewares/auth.middleware");
// ==================== PUBLIC API ====================

// Đăng ký user thường
// POST /api/v1/auth/register
router.post(
  "/register",
  [
    body("email")
      .notEmpty()
      .withMessage("Email không được để trống")
      .isEmail()
      .withMessage("Email không hợp lệ"),

    body("password")
      .notEmpty()
      .withMessage("Mật khẩu không được để trống")
      .isLength({ min: 6 })
      .withMessage("Mật khẩu phải có ít nhất 6 ký tự")
      .matches(/[A-Z]/)
      .withMessage("Mật khẩu phải có ít nhất 1 chữ hoa")
      .matches(/[0-9]/)
      .withMessage("Mật khẩu phải có ít nhất 1 chữ số")
      .matches(/[!@#$%^&*(),.?":{}|<>]/)
      .withMessage("Mật khẩu phải có ít nhất 1 ký tự đặc biệt"),

    body("full_name")
      .notEmpty()
      .withMessage("Họ và tên không được để trống")
      .isLength({ min: 2 })
      .withMessage("Họ và tên phải có ít nhất 2 ký tự"),
  ],
  validate,
  authController.register,
);

// Xác thực email bằng Magic Link
// POST /api/v1/auth/verify-email
router.post(
  "/verify-email",
  [
    body("token")
      .notEmpty()
      .withMessage("Token xác thực email không được để trống"),
  ],
  validate,
  authController.verifyEmail,
);

// Đăng nhập
// POST /api/v1/auth/login
router.post(
  "/login",
  [
    body("email")
      .notEmpty()
      .withMessage("Email không được để trống")
      .isEmail()
      .withMessage("Email không hợp lệ"),

    body("password").notEmpty().withMessage("Mật khẩu không được để trống"),
  ],
  validate,
  authController.login,
);

// Quên mật khẩu
// POST /api/v1/auth/forgot-password
router.post(
  "/forgot-password",
  [
    body("email")
      .notEmpty()
      .withMessage("Email không được để trống")
      .isEmail()
      .withMessage("Email không hợp lệ"),
  ],
  validate,
  authController.forgotPassword,
);

// Đặt lại mật khẩu bằng Magic Link
// POST /api/v1/auth/reset-password
router.post(
  "/reset-password",
  [
    body("token")
      .notEmpty()
      .withMessage("Token reset password không được để trống"),

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
  authController.resetPassword,
);

// ==================== PROTECTED API ====================

// Tạm giữ route này nếu code cũ còn dùng.
// Theo tài liệu mới, sau này nên chuyển sang:
// GET /api/v1/users/profile
router.get("/me", protect, authController.getMe);

// ==================== SUPER ADMIN API ====================

// Super Admin xem danh sách tất cả user
router.get(
  "/users",
  protect,
  authorize("SUPER_ADMIN"),
  authController.getAllUsers,
);

// Super Admin xem danh sách admin
router.get(
  "/admins",
  protect,
  authorize("SUPER_ADMIN"),
  authController.getAdmins,
);

// Super Admin tạo Admin
router.post(
  "/admin/create-admin",
  protect,
  authorize("SUPER_ADMIN"),
  [
    body("email")
      .notEmpty()
      .withMessage("Email không được để trống")
      .isEmail()
      .withMessage("Email không hợp lệ"),

    body("password")
      .notEmpty()
      .withMessage("Mật khẩu không được để trống")
      .isLength({ min: 6 })
      .withMessage("Mật khẩu phải có ít nhất 6 ký tự")
      .matches(/[A-Z]/)
      .withMessage("Mật khẩu phải có ít nhất 1 chữ hoa")
      .matches(/[0-9]/)
      .withMessage("Mật khẩu phải có ít nhất 1 chữ số")
      .matches(/[!@#$%^&*(),.?":{}|<>]/)
      .withMessage("Mật khẩu phải có ít nhất 1 ký tự đặc biệt"),

    body("full_name")
      .notEmpty()
      .withMessage("Họ và tên không được để trống")
      .isLength({ min: 2 })
      .withMessage("Họ và tên phải có ít nhất 2 ký tự"),
  ],
  validate,
  authController.createAdmin,
);

// Super Admin đổi role user
// role_id:
// 2 = USER
// 3 = PREMIUM
// 4 = ADMIN
// Không cho cấp SUPER_ADMIN qua API này
router.put(
  "/users/role",
  protect,
  authorize("SUPER_ADMIN"),
  [
    body("userId")
      .notEmpty()
      .withMessage("userId không được để trống")
      .isInt({ min: 1 })
      .withMessage("userId phải là số nguyên dương"),

    body("role_id")
      .notEmpty()
      .withMessage("role_id không được để trống")
      .isInt({ min: 2, max: 4 })
      .withMessage("role_id không hợp lệ"),
  ],
  validate,
  authController.updateRole,
);

// Super Admin khóa tài khoản
router.put(
  "/users/:id/ban",
  protect,
  authorize("SUPER_ADMIN"),
  [
    param("id")
      .isInt({ min: 1 })
      .withMessage("id user phải là số nguyên dương"),
  ],
  validate,
  authController.banUser,
);

// Super Admin mở khóa tài khoản
router.put(
  "/users/:id/unban",
  protect,
  authorize("SUPER_ADMIN"),
  [
    param("id")
      .isInt({ min: 1 })
      .withMessage("id user phải là số nguyên dương"),
  ],
  validate,
  authController.unbanUser,
);

// Test route Super Admin
router.get(
  "/super-admin-only",
  protect,
  authorize("SUPER_ADMIN"),
  (req, res) => {
    return res.json({
      status: "success",
      message: "Chào mừng Super Admin! Bạn có toàn quyền hệ thống.",
      data: null,
    });
  },
);

// ==================== ADMIN API ====================

// Admin và Super Admin đều vào được
router.get(
  "/admin-area",
  protect,
  authorize("ADMIN", "SUPER_ADMIN"),
  (req, res) => {
    return res.json({
      status: "success",
      message: `Chào mừng ${req.user.role}! Bạn có quyền quản trị.`,
      data: null,
    });
  },
);

// ==================== USER API ====================

// User, Premium, Admin, Super Admin đều vào được
router.get(
  "/user-area",
  protect,
  authorize("USER", "PREMIUM", "ADMIN", "SUPER_ADMIN"),
  (req, res) => {
    return res.json({
      status: "success",
      message: `Xin chào ${req.user.full_name}! Đây là khu vực người dùng.`,
      data: null,
    });
  },
);

module.exports = router;
