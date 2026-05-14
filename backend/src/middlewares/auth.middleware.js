// middleware/auth.js
// Tầng trung gian giữa request và response
// Dùng để kiểm tra đăng nhập, phân quyền, ghi log

const jwt = require("jsonwebtoken");
const db = require("../config/database");
const logger = require("../config/logger");
const { errorResponse } = require("../utils/response.helper");

// =========================
// KIỂM TRA ĐĂNG NHẬP
// =========================
async function protect(req, res, next) {
  try {
    let token;

    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      logger.warn(
        `⚠️ Không có token - IP: ${req.ip} - URL: ${req.method} ${req.url}`,
      );

      return errorResponse(
        res,
        "Bạn chưa đăng nhập.",
        "AUTH_TOKEN_REQUIRED",
        401,
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [rows] = await db.execute(
      `SELECT 
          u.id,
          u.full_name,
          u.email,
          u.role_id,
          r.name AS role,

          u.dob,
          u.phone,

          u.status,

          u.premium_until,
          u.ai_quota,
          u.is_reminder_enabled,

          u.created_at,
          u.updated_at
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [decoded.id],
    );

    if (rows.length === 0) {
      logger.warn(`❌ User không tồn tại - ID: ${decoded.id} - IP: ${req.ip}`);

      return errorResponse(
        res,
        "Token không hợp lệ.",
        "AUTH_INVALID_TOKEN",
        401,
      );
    }

    const user = rows[0];
    const displayName = user.full_name || user.email;

    if (user.status === "BANNED") {
      logger.warn(
        `🚫 Tài khoản bị khóa: ${displayName} (${user.role}) - IP: ${req.ip}`,
      );

      return errorResponse(
        res,
        "Tài khoản đã bị khóa.",
        "AUTH_ACCOUNT_BANNED",
        403,
      );
    }

    if (user.status === "UNVERIFIED") {
      logger.warn(
        `⚠️ Tài khoản chưa xác thực: ${displayName} (${user.role}) - IP: ${req.ip}`,
      );

      return errorResponse(
        res,
        "Vui lòng xác thực email trước khi sử dụng hệ thống.",
        "AUTH_EMAIL_NOT_VERIFIED",
        403,
      );
    }

    if (user.status !== "ACTIVE") {
      logger.warn(
        `⚠️ Trạng thái tài khoản không hợp lệ: ${displayName} (${user.status}) - IP: ${req.ip}`,
      );

      return errorResponse(
        res,
        "Trạng thái tài khoản không hợp lệ.",
        "AUTH_INVALID_STATUS",
        403,
      );
    }

    logger.info(
      `✅ Xác thực thành công: ${displayName} (${user.role}) - IP: ${req.ip}`,
    );

    req.user = user;

    next();
  } catch (error) {
    logger.error(`❌ Token lỗi: ${error.message} - IP: ${req.ip}`);

    return errorResponse(
      res,
      "Token không hợp lệ hoặc đã hết hạn.",
      "AUTH_INVALID_TOKEN",
      401,
    );
  }
}

// =========================
// KIỂM TRA QUYỀN THEO ROLE
// Ví dụ:
// authorize("ADMIN", "SUPER_ADMIN")
// =========================
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(
        res,
        "Bạn chưa đăng nhập.",
        "AUTH_TOKEN_REQUIRED",
        401,
      );
    }

    const displayName = req.user.full_name || req.user.email;

    if (!roles.includes(req.user.role)) {
      logger.warn(
        `🚨 CHẶN: ${displayName} (${req.user.role}) cố gắng vào ${req.method} ${req.url} - Cần role: ${roles.join(", ")}`,
      );

      return errorResponse(
        res,
        `Bạn không có quyền truy cập. Cần role: ${roles.join(", ")}`,
        "AUTH_FORBIDDEN",
        403,
      );
    }

    logger.info(
      `✅ CHO PHÉP: ${displayName} (${req.user.role}) vào ${req.method} ${req.url}`,
    );

    next();
  };
}

// =========================
// KIỂM TRA QUYỀN THEO PERMISSION
// Ví dụ:
// checkPermission("manage_users_and_roles")
// =========================
function checkPermission(permission) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return errorResponse(
          res,
          "Bạn chưa đăng nhập.",
          "AUTH_TOKEN_REQUIRED",
          401,
        );
      }

      const [rows] = await db.execute(
        `SELECT p.name
         FROM permissions p
         JOIN role_permissions rp ON p.id = rp.permission_id
         JOIN roles r ON r.id = rp.role_id
         JOIN users u ON u.role_id = r.id
         WHERE u.id = ? AND p.name = ?`,
        [req.user.id, permission],
      );

      const displayName = req.user.full_name || req.user.email;

      if (rows.length === 0) {
        logger.warn(
          `🚨 THIẾU QUYỀN: ${displayName} (${req.user.role}) - Cần quyền: ${permission}`,
        );

        return errorResponse(
          res,
          `Bạn không có quyền: ${permission}`,
          "AUTH_PERMISSION_DENIED",
          403,
        );
      }

      logger.info(
        `✅ CÓ QUYỀN: ${displayName} (${req.user.role}) - Quyền: ${permission}`,
      );

      next();
    } catch (error) {
      logger.error(`❌ Lỗi checkPermission: ${error.message}`);

      return errorResponse(
        res,
        "Lỗi server: " + error.message,
        "SERVER_ERROR",
        500,
      );
    }
  };
}

module.exports = {
  protect,
  authorize,
  checkPermission,
};
