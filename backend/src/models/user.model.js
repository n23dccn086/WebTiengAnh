const { pool: db } = require("../config/database");

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
// TÌM USER THEO ID (Không trả password_hash)
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
        u.current_streak,
        u.last_active_date,
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
// =========================
async function createUser({
  email,
  full_name,
  password_hash,
  role_id = ROLE_IDS.USER,
  status = "UNVERIFIED",
  ai_quota = 10 // Theo Business Logic, User thường được 10 lượt
}) {
  const [result] = await db.execute(
    `INSERT INTO users
     (
        role_id,
        email,
        password_hash,
        full_name,
        status,
        ai_quota
     )
     VALUES (?, ?, ?, ?, ?, ?)`,
    [role_id, email, password_hash, full_name, status, ai_quota],
  );

  return {
    id: result.insertId,
    role_id,
    email,
    full_name,
    status,
    ai_quota
  };
}

// =========================
// QUẢN LÝ TOKEN (Bảng user_tokens)
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

// Tìm token chung (Cho Reset, Verify)
async function findTokenRecord(token, type) {
    const [rows] = await db.execute(
        `SELECT * FROM user_tokens 
         WHERE token = ? AND type = ? AND expires_at > NOW()`,
        [token, type]
    );
    return rows[0] || null;
}

// MỚI: Dành cho luồng Refresh Token
async function findRefreshToken(token) {
    const [rows] = await db.execute(
        `SELECT * FROM user_tokens 
         WHERE token = ? AND type = 'REFRESH_TOKEN' AND expires_at > NOW()`,
        [token]
    );
    return rows[0] || null;
}

// Xóa 1 token bất kỳ bằng giá trị của nó
async function deleteToken(token) {
  const [result] = await db.execute(
    `DELETE FROM user_tokens WHERE token = ?`,
    [token],
  );
  return result.affectedRows > 0;
}

// MỚI: Dành cho luồng Logout
async function deleteRefreshToken(token) {
    const [result] = await db.execute(
        `DELETE FROM user_tokens 
         WHERE token = ? AND type = 'REFRESH_TOKEN'`,
        [token]
    );
    return result.affectedRows > 0;
}

async function deleteUserTokensByType(userId, type) {
  const [result] = await db.execute(
    `DELETE FROM user_tokens
     WHERE user_id = ? AND type = ?`,
    [userId, type],
  );
  return result.affectedRows > 0;
}

// =========================
// KÍCH HOẠT & CẬP NHẬT HỒ SƠ
// =========================
async function activateUser(userId) {
  const [result] = await db.execute(
    `UPDATE users SET status = 'ACTIVE' WHERE id = ?`,
    [userId],
  );
  return result.affectedRows > 0;
}

async function updatePassword(userId, passwordHash) {
  const [result] = await db.execute(
    `UPDATE users SET password_hash = ? WHERE id = ?`,
    [passwordHash, userId],
  );
  return result.affectedRows > 0;
}

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
// QUẢN TRỊ VIÊN (Admin & Super Admin)
// =========================
async function getAllUsers() {
  const [rows] = await db.execute(
    `SELECT u.id, u.role_id, r.name AS role, u.email, u.full_name, u.dob, u.phone,
            u.status, u.premium_until, u.ai_quota, u.is_reminder_enabled,
            u.created_at, u.updated_at
     FROM users u
     JOIN roles r ON u.role_id = r.id
     ORDER BY u.created_at DESC`,
  );
  return rows;
}

async function getAdmins() {
  const [rows] = await db.execute(
    `SELECT u.id, u.role_id, r.name AS role, u.email, u.full_name, u.status, u.created_at, u.updated_at
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE u.role_id = ?
     ORDER BY u.created_at DESC`,
    [ROLE_IDS.ADMIN],
  );
  return rows;
}

async function updateUserRole(userId, roleId) {
  const [result] = await db.execute(
    `UPDATE users SET role_id = ? WHERE id = ?`,
    [roleId, userId],
  );
  return result.affectedRows > 0;
}

async function updateUserStatus(userId, status) {
  const [result] = await db.execute(
    `UPDATE users SET status = ? WHERE id = ?`,
    [status, userId],
  );
  return result.affectedRows > 0;
}

async function banUser(userId) { return updateUserStatus(userId, "BANNED"); }
async function unbanUser(userId) { return updateUserStatus(userId, "ACTIVE"); }

// =========================
// CÁC TÍNH NĂNG NGHIỆP VỤ (Premium, AI Quota, Streak)
// =========================
async function upgradeToPremium(userId, premiumUntil, aiQuota = 200) {
  // SỬA LỖI: Theo rule, Premium có 200 lượt quota
  const [result] = await db.execute(
    `UPDATE users
     SET role_id = ?, premium_until = ?, ai_quota = ?
     WHERE id = ?`,
    [ROLE_IDS.PREMIUM, premiumUntil, aiQuota, userId],
  );
  return result.affectedRows > 0;
}

async function decreaseAiQuota(userId) {
  const [result] = await db.execute(
    `UPDATE users SET ai_quota = ai_quota - 1 WHERE id = ? AND ai_quota > 0`,
    [userId],
  );
  return result.affectedRows > 0;
}

async function updateReminderSetting(userId, isEnabled) {
  const [result] = await db.execute(
    `UPDATE users SET is_reminder_enabled = ? WHERE id = ?`,
    [isEnabled, userId],
  );
  return result.affectedRows > 0;
}

async function updateStreak(userId, streak, lastActiveDate) {
  const [result] = await db.execute(
    `UPDATE users SET current_streak = ?, last_active_date = ? WHERE id = ?`,
    [streak, lastActiveDate, userId]
  );
  return result.affectedRows > 0;
}

// =========================
// QUYỀN VÀ BẢO MẬT
// =========================
async function checkRolePermission(roleId, permissionName) {
  const [rows] = await db.execute(
    `SELECT p.name
     FROM permissions p
     JOIN role_permissions rp ON p.id = rp.permission_id
     WHERE rp.role_id = ? AND p.name = ?`,
    [roleId, permissionName]
  );
  return rows.length > 0;
}

async function deleteUser(userId) {
  const [result] = await db.execute(
    `DELETE FROM users WHERE id = ?`,
    [userId],
  );
  return result.affectedRows > 0;
}


// Trừ 1 quota AI của User
const decrementAiQuota = async (userId) => {
  await db.execute(
    `UPDATE users SET ai_quota = ai_quota - 1 WHERE id = ? AND ai_quota > 0`,
    [userId]
  );
};

// Cập nhật chuỗi ngày học liên tiếp (Streak)
// Hàm mới của Sprint 3 (Đổi tên để không bị trùng)
const updateSrsStreak = async (userId, action) => {
  if (action === 'RESET') {
    await db.execute(`UPDATE users SET current_streak = 0 WHERE id = ?`, [userId]);
  } else if (action === 'INCREMENT') {
    await db.execute(
      `UPDATE users 
       SET current_streak = current_streak + 1, last_active_date = CURRENT_DATE 
       WHERE id = ?`,
      [userId]
    );
  }
};

module.exports = {
  ROLE_IDS,
  findUserByEmail,
  findUserById,
  createUser,

  // Token management
  createUserToken,
  findTokenRecord,
  findRefreshToken,
  deleteToken,
  deleteRefreshToken,
  deleteUserTokensByType,

  activateUser,
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
  updateStreak,

  deleteUser,
  checkRolePermission,

  decrementAiQuota,
  updateSrsStreak
  
};