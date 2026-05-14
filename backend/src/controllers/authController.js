// controllers/authController.js

const jwt = require("jsonwebtoken"); //tạo JWT accessToken khi đăng nhập
const bcrypt = require("bcryptjs"); //mã hóa mật khẩu và so sánh mật khẩu
const crypto = require("crypto"); //tạo token ngẫu nhiên cho xác thực email/reset password

const User = require("../models/user.model"); //Import model User

const {
  //Hai hàm này dùng để gửi email:
  sendVerificationEmail,
  sendResetPasswordEmail,
} = require("../config/email");

const { successResponse, errorResponse } = require("../utils/response.helper"); //ai hàm này giúp chuẩn hóa JSON trả về.

// =========================
// ROLE ID THEO DATABASE MỚI
// =========================
const ROLE_IDS = {
  GUEST: 1,
  USER: 2,
  PREMIUM: 3,
  ADMIN: 4,
  SUPER_ADMIN: 5,
};

// =========================
// TẠO ACCESS TOKEN
// =========================
function generateAccessToken(user) {
  //Hàm này tạo JWT token sau khi đăng nhập thành công.id → id user
  // role → USER / ADMIN / SUPER_ADMIN
  // role_id → số role trong database
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      role_id: user.role_id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );
}

// =========================
// ĐĂNG KÝ USER THƯỜNG
// POST /api/v1/auth/register
// Body: { email, password, full_name }
// =========================
async function register(req, res) {
  try {
    const { email, password, full_name } = req.body; //Lấy email, password, full_name từ req.body

    const normalizedEmail = email.trim().toLowerCase(); //Chuẩn hóa email về chữ thường
    const normalizedFullName = full_name.trim();

    const existingUser = await User.findUserByEmail(normalizedEmail); //Kiểm tra email đã tồn tại chưa

    if (existingUser) {
      return errorResponse(
        res,
        "Email đã được đăng ký.",
        "AUTH_EMAIL_EXISTS",
        400,
      );
    }

    const passwordHash = await bcrypt.hash(password, 10); //Hash mật khẩu bằng bcrypt

    const newUser = await User.createUser({
      //Tạo user mới với role USER
      email: normalizedEmail,
      full_name: normalizedFullName,
      password_hash: passwordHash,
      role_id: ROLE_IDS.USER,
      status: "UNVERIFIED",
    });

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpires = new Date(Date.now() + 15 * 60 * 1000);

    await User.deleteUserTokensByType(newUser.id, "VERIFY_EMAIL"); //dùng để xóa các token xác thực email cũ của user đó trước khi tạo token mới.

    await User.createUserToken(
      newUser.id,
      verificationToken,
      "VERIFY_EMAIL",
      verificationTokenExpires,
    );

    await sendVerificationEmail(normalizedEmail, verificationToken); //Gửi email xác thực

    return successResponse(
      // Trả response thành công
      res,
      "Đăng ký thành công! Vui lòng kiểm tra hộp thư đến để xác nhận email.",
      null,
      201,
    );
  } catch (error) {
    console.error(error);

    return errorResponse(
      res,
      "Lỗi server: " + error.message,
      "SERVER_ERROR",
      500,
    );
  }
}

// =========================
// XÁC THỰC EMAIL
// POST /api/v1/auth/verify-email
// Body: { token }
// =========================
async function verifyEmail(req, res) {
  try {
    const { token } = req.body; // Nhận token từ body

    if (!token) {
      //Kiểm tra token có tồn tại không
      return errorResponse(
        res,
        "Thiếu token xác thực email.",
        "AUTH_TOKEN_REQUIRED",
        400,
      );
    }

    const user = await User.findUserByToken(token, "VERIFY_EMAIL");

    if (!user) {
      //Kiểm tra token còn hạn không
      return errorResponse(
        res,
        "Đường dẫn xác thực không hợp lệ hoặc đã hết hạn.",
        "AUTH_INVALID_TOKEN",
        400,
      );
    }

    if (user.status === "BANNED") {
      return errorResponse(
        res,
        "Tài khoản đã bị khóa, không thể xác thực.",
        "AUTH_ACCOUNT_BANNED",
        403,
      );
    }

    await User.activateUser(user.id);
    await User.deleteUserToken(token, "VERIFY_EMAIL"); // Xóa token đã dùng

    return successResponse(
      res,
      "Xác thực email thành công. Bạn đã có thể đăng nhập.",
      null,
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

// =========================
// ĐĂNG NHẬP
// POST /api/v1/auth/login
// Body: { email, password }
// =========================
async function login(req, res) {
  try {
    const { email, password } = req.body;

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findUserByEmail(normalizedEmail);

    if (!user) {
      return errorResponse(
        res,
        "Email hoặc mật khẩu không chính xác.",
        "AUTH_INVALID_CREDENTIALS",
        401,
      );
    }

    if (user.status === "UNVERIFIED") {
      return errorResponse(
        res,
        "Vui lòng xác thực email trước khi đăng nhập.",
        "AUTH_EMAIL_NOT_VERIFIED",
        403,
      );
    }

    if (user.status === "BANNED") {
      return errorResponse(
        res,
        "Tài khoản đã bị khóa.",
        "AUTH_ACCOUNT_BANNED",
        403,
      );
    }

    if (user.status !== "ACTIVE") {
      return errorResponse(
        res,
        "Trạng thái tài khoản không hợp lệ.",
        "AUTH_INVALID_STATUS",
        403,
      );
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password_hash,
    );

    if (!isPasswordCorrect) {
      return errorResponse(
        res,
        "Email hoặc mật khẩu không chính xác.",
        "AUTH_INVALID_CREDENTIALS",
        401,
      );
    }

    const accessToken = generateAccessToken(user);

    return successResponse(res, "Đăng nhập thành công", {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
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
// QUÊN MẬT KHẨU
// POST /api/v1/auth/forgot-password
// Body: { email }
// =========================
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findUserByEmail(normalizedEmail);

    // Không tiết lộ email có tồn tại hay không
    if (!user) {
      return successResponse(
        res,
        "Một đường link khôi phục mật khẩu đã được gửi đến email của bạn.",
        null,
        200,
      );
    }

    if (user.status === "BANNED") {
      return errorResponse(
        res,
        "Tài khoản đã bị khóa, không thể đặt lại mật khẩu.",
        "AUTH_ACCOUNT_BANNED",
        403,
      );
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000);

    await User.deleteUserTokensByType(user.id, "RESET_PASSWORD");

    await User.createUserToken(
      user.id,
      resetToken,
      "RESET_PASSWORD",
      resetTokenExpires,
    );

    await sendResetPasswordEmail(normalizedEmail, resetToken);

    return successResponse(
      res,
      "Một đường link khôi phục mật khẩu đã được gửi đến email của bạn.",
      null,
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

// =========================
// ĐẶT LẠI MẬT KHẨU
// POST /api/v1/auth/reset-password
// Body: { token, new_password }
// =========================
async function resetPassword(req, res) {
  try {
    const { token, new_password } = req.body;

    if (!token) {
      return errorResponse(
        res,
        "Thiếu token đặt lại mật khẩu.",
        "AUTH_TOKEN_REQUIRED",
        400,
      );
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{6,}$/;

    if (!passwordRegex.test(new_password)) {
      return errorResponse(
        res,
        "Mật khẩu phải có ít nhất 6 ký tự, 1 chữ hoa, 1 số và 1 ký tự đặc biệt.",
        "AUTH_PASSWORD_WEAK",
        400,
      );
    }

    const user = await User.findUserByToken(token, "RESET_PASSWORD");

    if (!user) {
      return errorResponse(
        res,
        "Token reset password không hợp lệ hoặc đã hết hạn.",
        "AUTH_INVALID_TOKEN",
        400,
      );
    }

    if (user.status === "BANNED") {
      return errorResponse(
        res,
        "Tài khoản đã bị khóa, không thể đặt lại mật khẩu.",
        "AUTH_ACCOUNT_BANNED",
        403,
      );
    }

    const passwordHash = await bcrypt.hash(new_password, 10);

    await User.updatePassword(user.id, passwordHash);
    await User.deleteUserToken(token, "RESET_PASSWORD");

    return successResponse(
      res,
      "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.",
      null,
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

// =========================
// THÔNG TIN USER HIỆN TẠI
// GET /api/v1/auth/me
// Lưu ý: API chuẩn mới nên dùng GET /api/v1/users/profile
// =========================
async function getMe(req, res) {
  try {
    const user = await User.findUserById(req.user.id);

    if (!user) {
      return errorResponse(res, "Không tìm thấy user.", "USER_NOT_FOUND", 404);
    }

    return successResponse(
      res,
      "Lấy thông tin user thành công.",
      {
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
        created_at: user.created_at,
        updated_at: user.updated_at,
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

// =========================
// SUPER ADMIN: LẤY DANH SÁCH USER
// =========================
async function getAllUsers(req, res) {
  try {
    const users = await User.getAllUsers();

    return successResponse(res, "Lấy danh sách user thành công.", users, 200);
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
// SUPER ADMIN: LẤY DANH SÁCH ADMIN
// =========================
async function getAdmins(req, res) {
  try {
    const admins = await User.getAdmins();

    return successResponse(res, "Lấy danh sách admin thành công.", admins, 200);
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
// SUPER ADMIN: CẬP NHẬT ROLE USER
// Chỉ cho đổi thành USER / PREMIUM / ADMIN.
// Không cho cấp SUPER_ADMIN qua API.
// =========================
async function updateRole(req, res) {
  try {
    const { userId, role_id } = req.body;

    const targetUserId = Number(userId);
    const roleId = Number(role_id);

    if (!targetUserId || !roleId) {
      return errorResponse(
        res,
        "Thiếu userId hoặc role_id.",
        "VALIDATION_ERROR",
        400,
      );
    }

    if (targetUserId === req.user.id) {
      return errorResponse(
        res,
        "Không thể tự đổi role của chính mình.",
        "ADMIN_SELF_ROLE_CHANGE_DENIED",
        400,
      );
    }

    const allowedRoleIds = [ROLE_IDS.USER, ROLE_IDS.PREMIUM, ROLE_IDS.ADMIN];

    if (!allowedRoleIds.includes(roleId)) {
      return errorResponse(
        res,
        "Role không hợp lệ. Chỉ được đổi thành USER, PREMIUM hoặc ADMIN.",
        "ADMIN_INVALID_ROLE",
        400,
      );
    }

    const targetUser = await User.findUserById(targetUserId);

    if (!targetUser) {
      return errorResponse(
        res,
        "Không tìm thấy tài khoản cần đổi role.",
        "USER_NOT_FOUND",
        404,
      );
    }

    if (targetUser.role === "SUPER_ADMIN") {
      return errorResponse(
        res,
        "Không thể đổi role của Super Admin.",
        "ADMIN_PROTECT_SUPER_ADMIN",
        403,
      );
    }

    const updated = await User.updateUserRole(targetUserId, roleId);

    if (!updated) {
      return errorResponse(
        res,
        "Cập nhật role thất bại.",
        "ADMIN_UPDATE_ROLE_FAILED",
        400,
      );
    }

    return successResponse(res, "Cập nhật role thành công.", null, 200);
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
// SUPER ADMIN: KHÓA TÀI KHOẢN
// =========================
async function banUser(req, res) {
  try {
    const userId = Number(req.params.id);

    if (!userId) {
      return errorResponse(
        res,
        "userId không hợp lệ.",
        "VALIDATION_ERROR",
        400,
      );
    }

    if (userId === req.user.id) {
      return errorResponse(
        res,
        "Không thể tự khóa tài khoản của chính mình.",
        "ADMIN_SELF_BAN_DENIED",
        400,
      );
    }

    const targetUser = await User.findUserById(userId);

    if (!targetUser) {
      return errorResponse(
        res,
        "Không tìm thấy tài khoản.",
        "USER_NOT_FOUND",
        404,
      );
    }

    if (targetUser.role === "SUPER_ADMIN") {
      return errorResponse(
        res,
        "Không thể khóa tài khoản Super Admin.",
        "ADMIN_PROTECT_SUPER_ADMIN",
        403,
      );
    }

    const updated = await User.banUser(userId);

    if (!updated) {
      return errorResponse(
        res,
        "Khóa tài khoản thất bại.",
        "ADMIN_BAN_FAILED",
        400,
      );
    }

    return successResponse(res, "Khóa tài khoản thành công.", null, 200);
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
// SUPER ADMIN: MỞ KHÓA TÀI KHOẢN
// =========================
async function unbanUser(req, res) {
  try {
    const userId = Number(req.params.id);

    if (!userId) {
      return errorResponse(
        res,
        "userId không hợp lệ.",
        "VALIDATION_ERROR",
        400,
      );
    }

    const targetUser = await User.findUserById(userId);

    if (!targetUser) {
      return errorResponse(
        res,
        "Không tìm thấy tài khoản.",
        "USER_NOT_FOUND",
        404,
      );
    }

    if (targetUser.role === "SUPER_ADMIN") {
      return errorResponse(
        res,
        "Không thể mở khóa tài khoản Super Admin bằng API này.",
        "ADMIN_PROTECT_SUPER_ADMIN",
        403,
      );
    }

    const updated = await User.unbanUser(userId);

    if (!updated) {
      return errorResponse(
        res,
        "Mở khóa tài khoản thất bại.",
        "ADMIN_UNBAN_FAILED",
        400,
      );
    }

    return successResponse(res, "Mở khóa tài khoản thành công.", null, 200);
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
// SUPER ADMIN TẠO ADMIN
// POST /api/v1/auth/admin/create-admin
// Body: { email, password, full_name }
// =========================
async function createAdmin(req, res) {
  try {
    const { email, password, full_name } = req.body;

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedFullName = full_name.trim();

    const existingUser = await User.findUserByEmail(normalizedEmail);

    if (existingUser) {
      return errorResponse(res, "Email đã tồn tại.", "AUTH_EMAIL_EXISTS", 400);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newAdmin = await User.createUser({
      email: normalizedEmail,
      full_name: normalizedFullName,
      password_hash: passwordHash,
      role_id: ROLE_IDS.ADMIN,
      status: "ACTIVE",
    });

    return successResponse(
      res,
      "Tạo tài khoản Admin thành công.",
      {
        id: newAdmin.id,
        email: newAdmin.email,
        full_name: newAdmin.full_name,
        role: "ADMIN",
        status: newAdmin.status,
      },
      201,
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
  register,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,

  getMe,

  createAdmin,
  getAllUsers,
  getAdmins,
  updateRole,
  banUser,
  unbanUser,
};
