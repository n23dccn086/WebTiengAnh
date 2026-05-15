// File: src/routes/v1/auth.route.js
const express = require('express');
const router = express.Router();

const authController = require('../../controllers/auth.controller');
const validate = require('../../middlewares/validate.middleware');
const {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../../validations/auth.validation');

// ==================== PUBLIC API (Không cần đăng nhập) ====================

// 1. Đăng ký
router.post('/register', validate(registerSchema), authController.register);

// 2. Đăng nhập
router.post('/login', validate(loginSchema), authController.login);

// 3. Xác thực Email bằng link
router.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail);

// 4. Quên mật khẩu (Gửi link)
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);

// 5. Đặt lại mật khẩu (Nhập pass mới)
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

module.exports = router;