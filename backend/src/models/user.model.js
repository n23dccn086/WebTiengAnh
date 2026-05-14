const db = require("../config/database");

// =========================
// ROLE ID THEO DATABASE
// =========================
const ROLE_IDS = {
  GUEST: 1,
  USER: 2,
  PREMIUM: 3,
  ADMIN: 4,
  SUPER_ADMIN: 5,
};

// =========================
// TÌM USER THEO EMAIL
// Dùng cho login, forgot password, đổi mật khẩu
// Có trả password_hash vì login cần bcrypt.compare()
// =========================
async function findUserByEmail(email) {
  const [rows] = await db.execute(
    `SELECT 
        u.*,
        r.name AS role
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE u.email = ?`,
    [email],
  );

  return rows[0] || null;
}

// =========================
// TÌM USER THEO ID
// Không trả password_hash để tránh lộ dữ liệu nhạy cảm
// Dùng cho profile, middleware protect
// =========================
async function findUserById(id) {
  const [rows] = await db.execute(
    `SELECT 
        u.id,
        u.role_id,
        r.name AS role,

        u.email,
        u.full_name,
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
    [id],
  );

  return rows[0] || null;
}

// =========================
// TẠO USER MỚI
// Theo tài liệu mới:
// Không dùng username
// Register chỉ có: email, password, full_name
// Mặc định role_id = 2 => USER
// Mặc định status = UNVERIFIED
// =========================
async function createUser({
  email,
  full_name,
  password_hash,
  role_id = ROLE_IDS.USER,
  status = "UNVERIFIED",
}) {
  const [result] = await db.execute(
    `INSERT INTO users
     (
        role_id,
        email,
        password_hash,
        full_name,
        status
     )
     VALUES (?, ?, ?, ?, ?)`,
    [role_id, email, password_hash, full_name, status],
  );

  return {
    id: result.insertId,
    role_id,
    email,
    full_name,
    status,
  };
}

// =========================
// TẠO TOKEN CHO USER
// type:
// VERIFY_EMAIL
// RESET_PASSWORD
// REFRESH_TOKEN
// =========================
async function createUserToken(userId, token, type, expiresAt) {
  const [result] = await db.execute(
    `INSERT INTO user_tokens
     (user_id, token, type, expires_at)
     VALUES (?, ?, ?, ?)`,
    [userId, token, type, expiresAt],
  );

  return result.insertId;
}

// =========================
// TÌM USER BẰNG TOKEN
// Dùng cho verify email và reset password
// =========================
async function findUserByToken(token, type) {
  const [rows] = await db.execute(
    `SELECT 
        u.*,
        r.name AS role,
        ut.id AS token_id,
        ut.type AS token_type,
        ut.expires_at
     FROM users u
     JOIN roles r ON u.role_id = r.id
     JOIN user_tokens ut ON u.id = ut.user_id
     WHERE ut.token = ?
       AND ut.type = ?
       AND ut.expires_at > NOW()`,
    [token, type],
  );

  return rows[0] || null;
}

// =========================
// XÓA 1 TOKEN SAU KHI DÙNG
// =========================
async function deleteUserToken(token, type) {
  const [result] = await db.execute(
    `DELETE FROM user_tokens
     WHERE token = ? AND type = ?`,
    [token, type],
  );

  return result.affectedRows > 0;
}

// =========================
// XÓA TOKEN CŨ CÙNG LOẠI CỦA USER
// Ví dụ: trước khi gửi reset password mới
// =========================
async function deleteUserTokensByType(userId, type) {
  const [result] = await db.execute(
    `DELETE FROM user_tokens
     WHERE user_id = ? AND type = ?`,
    [userId, type],
  );

  return result.affectedRows > 0;
}

// =========================
// KÍCH HOẠT USER SAU KHI XÁC THỰC EMAIL
// UNVERIFIED -> ACTIVE
// =========================
async function activateUser(userId) {
  const [result] = await db.execute(
    `UPDATE users
     SET status = 'ACTIVE'
     WHERE id = ?`,
    [userId],
  );

  return result.affectedRows > 0;
}

// Giữ alias này để code cũ gọi verifyUserEmail vẫn không lỗi
async function verifyUserEmail(userId) {
  return activateUser(userId);
}

// =========================
// CẬP NHẬT MẬT KHẨU
// =========================
async function updatePassword(userId, passwordHash) {
  const [result] = await db.execute(
    `UPDATE users
     SET password_hash = ?
     WHERE id = ?`,
    [passwordHash, userId],
  );

  return result.affectedRows > 0;
}

// =========================
// CẬP NHẬT HỒ SƠ USER
// Cho phép sửa:
// full_name
// dob
// phone
// =========================
async function updateProfile(userId, { full_name, dob, phone }) {
  const [result] = await db.execute(
    `UPDATE users
     SET full_name = COALESCE(?, full_name),
         dob = COALESCE(?, dob),
         phone = COALESCE(?, phone)
     WHERE id = ?`,
    [full_name || null, dob || null, phone || null, userId],
  );

  return result.affectedRows > 0;
}

// =========================
// LẤY TẤT CẢ USER
// Dùng cho Super Admin
// Không trả password_hash
// =========================
async function getAllUsers() {
  const [rows] = await db.execute(
    `SELECT
        u.id,
        u.role_id,
        r.name AS role,

        u.email,
        u.full_name,
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
     ORDER BY u.created_at DESC`,
  );

  return rows;
}

// =========================
// LẤY DANH SÁCH ADMIN
// Dùng cho Super Admin
// =========================
async function getAdmins() {
  const [rows] = await db.execute(
    `SELECT
        u.id,
        u.role_id,
        r.name AS role,

        u.email,
        u.full_name,
        u.status,

        u.created_at,
        u.updated_at
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE u.role_id = ?
     ORDER BY u.created_at DESC`,
    [ROLE_IDS.ADMIN],
  );

  return rows;
}

// =========================
// CẬP NHẬT ROLE USER
// roleId:
// 2 = USER
// 3 = PREMIUM
// 4 = ADMIN
// 5 = SUPER_ADMIN
// =========================
async function updateUserRole(userId, roleId) {
  const [result] = await db.execute(
    `UPDATE users
     SET role_id = ?
     WHERE id = ?`,
    [roleId, userId],
  );

  return result.affectedRows > 0;
}

// =========================
// CẬP NHẬT STATUS USER
// status:
// UNVERIFIED
// ACTIVE
// BANNED
// =========================
async function updateUserStatus(userId, status) {
  const [result] = await db.execute(
    `UPDATE users
     SET status = ?
     WHERE id = ?`,
    [status, userId],
  );

  return result.affectedRows > 0;
}

// =========================
// KHÓA USER
// =========================
async function banUser(userId) {
  return updateUserStatus(userId, "BANNED");
}

// =========================
// MỞ KHÓA USER
// =========================
async function unbanUser(userId) {
  return updateUserStatus(userId, "ACTIVE");
}

// =========================
// NÂNG USER LÊN PREMIUM
// Dùng sau thanh toán thành công
// =========================
async function upgradeToPremium(userId, premiumUntil, aiQuota = 100) {
  const [result] = await db.execute(
    `UPDATE users
     SET role_id = ?,
         premium_until = ?,
         ai_quota = ?
     WHERE id = ?`,
    [ROLE_IDS.PREMIUM, premiumUntil, aiQuota, userId],
  );

  return result.affectedRows > 0;
}

// =========================
// TRỪ AI QUOTA
// Dùng khi user gọi tính năng AI
// =========================
async function decreaseAiQuota(userId) {
  const [result] = await db.execute(
    `UPDATE users
     SET ai_quota = ai_quota - 1
     WHERE id = ?
       AND ai_quota > 0`,
    [userId],
  );

  return result.affectedRows > 0;
}

// =========================
// BẬT / TẮT NHẮC HỌC
// =========================
async function updateReminderSetting(userId, isEnabled) {
  const [result] = await db.execute(
    `UPDATE users
     SET is_reminder_enabled = ?
     WHERE id = ?`,
    [isEnabled, userId],
  );

  return result.affectedRows > 0;
}

// =========================
// XÓA USER
// =========================
async function deleteUser(userId) {
  const [result] = await db.execute(
    `DELETE FROM users
     WHERE id = ?`,
    [userId],
  );

  return result.affectedRows > 0;
}

module.exports = {
  ROLE_IDS,

  findUserByEmail,
  findUserById,
  createUser,

  createUserToken,
  findUserByToken,
  deleteUserToken,
  deleteUserTokensByType,

  activateUser,
  verifyUserEmail,
  updatePassword,
  updateProfile,

  getAllUsers,
  getAdmins,

  updateUserRole,
  updateUserStatus,
  banUser,
  unbanUser,

  upgradeToPremium,
  decreaseAiQuota,
  updateReminderSetting,

  deleteUser,
};
