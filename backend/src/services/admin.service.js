const bcrypt = require("bcryptjs");
const XLSX = require("xlsx");
const AdminModel = require("../models/admin.model");
const UserModel = require("../models/user.model");
const ServiceModel = require("../models/service.model");
const AppError = require("../utils/appError");

// ==========================================
// API 4: LẤY DANH SÁCH USER
// ==========================================
const getUsers = async (page = 1, limit = 20, search = "", status = "") => {
  const offset = (page - 1) * limit;
  const result = await AdminModel.getUsers(limit, offset, search, status);
  return {
    users: result.users,
    pagination: {
      total: result.total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(result.total / limit),
    },
  };
};

// ==========================================
// API 5: BAN / UNBAN USER
// ==========================================
const changeUserStatus = async (userId, status) => {
  if (!["ACTIVE", "BANNED", "UNVERIFIED"].includes(status)) {
    throw new AppError(400, "Trạng thái không hợp lệ", "INVALID_STATUS");
  }
  const user = await UserModel.findUserById(userId);
  if (!user) throw new AppError(404, "Không tìm thấy user", "USER_NOT_FOUND");
  await AdminModel.updateUserStatus(userId, status);
  return { id: userId, status };
};

// ==========================================
// API 6: ĐỔI ROLE USER
// ==========================================
const changeUserRole = async (userId, roleName) => {
  if (!["USER", "PREMIUM", "ADMIN"].includes(roleName)) {
    throw new AppError(400, "Role không hợp lệ", "INVALID_ROLE");
  }
  const user = await UserModel.findUserById(userId);
  if (!user) throw new AppError(404, "Không tìm thấy user", "USER_NOT_FOUND");
  await AdminModel.updateUserRole(userId, roleName);
  return { id: userId, role: roleName };
};

// ==========================================
// API 7: QUẢN LÝ SERVICE
// ==========================================
const getServices = async () => {
  return await ServiceModel.getAllServicesForAdmin();
};

const createService = async (title, description, status) => {
  const id = await AdminModel.createService(title, description, status);
  return { id, title, description, status: status || "VISIBLE" };
};

const updateService = async (serviceId, title, description, status) => {
  await AdminModel.updateService(serviceId, title, description, status);
  return { id: serviceId, title, description, status };
};

const updateServiceStatus = async (serviceId, status) => {
  await AdminModel.updateServiceStatus(serviceId, status);
  return { id: serviceId, status };
};

const deleteService = async (serviceId) => {
  await AdminModel.deleteService(serviceId);
  return { message: "Xóa service thành công" };
};

// ==========================================
// API 8: TẠO BỘ FLASHCARD HỆ THỐNG
// ==========================================
const createSystemFlashcardSet = async (
  adminId,
  serviceId,
  title,
  description,
  flashcards,
) => {
  if (!flashcards || flashcards.length === 0) {
    throw new AppError(
      400,
      "Bộ thẻ phải có ít nhất 1 flashcard",
      "EMPTY_FLASHCARDS",
    );
  }
  const setId = await AdminModel.createSystemFlashcardSet(
    adminId,
    serviceId,
    title,
    description,
    flashcards,
  );
  return { setId, title, is_system: true, total_cards: flashcards.length };
};

// ==========================================
// API 9: XEM DANH SÁCH GIAO DỊCH & DOANH THU
// ==========================================
const getTransactions = async (page = 1, limit = 20, status = "") => {
  const offset = (page - 1) * limit;
  const result = await AdminModel.getTransactions(limit, offset, status);
  return {
    transactions: result.transactions,
    total_revenue: result.total_revenue,
    pagination: {
      page: Number(page),
      limit: Number(limit),
    },
  };
};

// ==========================================
// API 10: QUẢN LÝ STAFF (SUPER ADMIN)
// ==========================================
const createStaff = async (email, fullName, password) => {
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await UserModel.findUserByEmail(normalizedEmail);
  if (existingUser) {
    throw new AppError(
      400,
      "Email này đã tồn tại trong hệ thống",
      "EMAIL_EXISTS",
    );
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const staffId = await AdminModel.createStaff(
    normalizedEmail,
    fullName,
    passwordHash,
  );
  return {
    id: staffId,
    email: normalizedEmail,
    full_name: fullName,
    role: "ADMIN",
  };
};

const deleteStaff = async (superAdminId, staffId) => {
  if (Number(superAdminId) === Number(staffId)) {
    throw new AppError(
      403,
      "Bạn không thể tự xóa chính mình",
      "CANT_DELETE_SELF",
    );
  }
  const staff = await UserModel.findUserById(staffId);
  if (!staff || staff.role !== "ADMIN") {
    throw new AppError(
      404,
      "Không tìm thấy tài khoản Admin này",
      "STAFF_NOT_FOUND",
    );
  }
  await AdminModel.deleteStaff(staffId);
  return { message: "Đã xóa tài khoản Admin" };
};

const resetStaffPassword = async (staffId, newPassword) => {
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await AdminModel.updateStaffPassword(staffId, passwordHash);
  return { message: "Đã đặt lại mật khẩu cho Admin" };
};

// ==========================================
// API IMPORT EXCEL (ĐÃ IMPLEMENT)
// ==========================================
const importSystemFlashcardSet = async (
  adminId,
  fileBuffer,
  title,
  serviceId,
  description = null,
) => {
  try {
    if (!fileBuffer || fileBuffer.length === 0) {
      throw new AppError(400, "File không có dữ liệu", "EMPTY_FILE");
    }
    // Xóa BOM nếu có
    let buffer = fileBuffer;
    if (buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
      buffer = buffer.slice(3);
    }
    let workbook;
    try {
      workbook = XLSX.read(buffer, { type: "buffer" });
    } catch (err) {
      throw new AppError(
        400,
        "File không hợp lệ hoặc bị hỏng. Hãy dùng file CSV chuẩn (UTF-8) hoặc Excel (.xlsx)",
        "INVALID_FILE",
      );
    }
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    let data = XLSX.utils.sheet_to_json(sheet);
    if (!data || data.length === 0) {
      throw new AppError(400, "File không có dữ liệu", "EMPTY_FILE");
    }
    // Chuẩn hóa dữ liệu
    const flashcards = data
      .map((row) => {
        const word = row.word || row.Word || row.WORD || "";
        const meaning = row.meaning || row.Meaning || row.MEANING || "";
        return {
          word: word.toString().trim(),
          meaning: meaning.toString().trim(),
          pronunciation:
            (row.pronunciation || row.Pronunciation || row.PRONUNCIATION || "")
              .toString()
              .trim() || null,
          example_sentence:
            (row.example_sentence || row.Example || row.EXAMPLE || "")
              .toString()
              .trim() || null,
          part_of_speech:
            (row.part_of_speech || row.PartOfSpeech || row.PART_OF_SPEECH || "")
              .toString()
              .trim() || null,
        };
      })
      .filter((card) => card.word && card.meaning);
    if (flashcards.length === 0) {
      throw new AppError(
        400,
        'File không có từ vựng hợp lệ (cần ít nhất cột "word" và "meaning")',
        "INVALID_DATA",
      );
    }
    const setId = await AdminModel.createSystemFlashcardSet(
      adminId,
      serviceId,
      title,
      description,
      flashcards,
    );
    return { setId, title, is_system: true, total_cards: flashcards.length };
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Import error:", error);
    throw new AppError(500, "Lỗi xử lý file, vui lòng thử lại", "IMPORT_ERROR");
  }
};


const getSetsByServiceId = async (serviceId) => {
  // 1. Lấy tên dịch vụ
  const title = await AdminModel.getServiceTitleById(serviceId);
  const serviceName = title ? title : `Dịch vụ #${serviceId}`;

  // 2. Lấy danh sách bộ thẻ
  const sets = await AdminModel.getSystemSetsByService(serviceId);

  // 3. Đóng gói dữ liệu trả về
  return {
    service_id: serviceId,
    service_name: serviceName,
    sets: sets
  };
};


const getStaff = async () => {
  const staffList = await AdminModel.getStaffList();
  return staffList;
};


module.exports = {
  getStaff,
  getSetsByServiceId,
  getUsers,
  changeUserStatus,
  changeUserRole,
  getServices,
  createService,
  updateService,
  updateServiceStatus,
  deleteService,
  createSystemFlashcardSet,
  importSystemFlashcardSet,
  getTransactions,
  createStaff,
  deleteStaff,
  resetStaffPassword,
};
