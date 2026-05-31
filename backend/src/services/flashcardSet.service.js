const FlashcardSetModel = require("../models/flashcardSet.model");
const FlashcardModel = require("../models/flashcard.model");
const UserModel = require("../models/user.model");
const DocumentModel = require("../models/document.model");
const GeminiService = require("./gemini.service");
const extractTextFromPDF = require("../utils/pdfExtract");
const AppError = require("../utils/appError");
const db = require("../config/database");
const XLSX = require('xlsx');

const getUserSets = async (userId, page, limit, serviceId) => {
  const offset = (page - 1) * limit;
  const { sets, totalItems } = await FlashcardSetModel.getSetsByUser(userId, limit, offset);
  const totalPages = Math.ceil(totalItems / limit);
  return { sets, pagination: { current_page: page, total_pages: totalPages, total_items: totalItems, limit } };
};

const getSystemSets = async (userId, serviceId = null) => {
  return await FlashcardSetModel.getSystemSets(userId, serviceId);
};


const createSet = async (userId, title, description, serviceId) => await FlashcardSetModel.createSet(userId, title, description, serviceId);

const getSetDetail = async (setId, userId) => {
  const setDetail = await FlashcardSetModel.getSetById(setId, userId);
  if (!setDetail) throw new AppError(404, "Không tìm thấy bộ thẻ hoặc không có quyền truy cập.", "SET_NOT_FOUND");
  if (!setDetail.is_system && setDetail.user_id !== userId) throw new AppError(403, "Bạn không có quyền xem bộ thẻ này.", "AUTH_FORBIDDEN");
  const flashcards = await FlashcardModel.getFlashcardsBySet(setId);
  setDetail.total_cards = flashcards.length;
  setDetail.flashcards = flashcards;
  return setDetail;
};

const updateSet = async (setId, userId, title, description) => {
  const setDetail = await FlashcardSetModel.getSetById(setId, userId);
  if (!setDetail) throw new AppError(404, "Không tìm thấy bộ thẻ.", "SET_NOT_FOUND");
  if (setDetail.is_system) throw new AppError(403, "Không thể sửa bộ thẻ hệ thống.", "CANNOT_EDIT_SYSTEM_SET");
  if (setDetail.user_id !== userId) throw new AppError(403, "Không có quyền sửa bộ thẻ này.", "AUTH_FORBIDDEN");
  await FlashcardSetModel.updateSet(setId, title, description);
};

const deleteSet = async (setId, userId) => {
  const setDetail = await FlashcardSetModel.getSetById(setId, userId);
  if (!setDetail) throw new AppError(404, "Không tìm thấy bộ thẻ.", "SET_NOT_FOUND");
  if (setDetail.is_system) throw new AppError(403, "Không thể xóa bộ thẻ hệ thống.", "CANNOT_DELETE_SYSTEM_SET");
  if (setDetail.user_id !== userId) throw new AppError(403, "Không có quyền xóa.", "AUTH_FORBIDDEN");
  await FlashcardSetModel.deleteSet(setId);
};

const toggleSrs = async (userId, setId, isSrsEnabled, dailyNewWords, deleteFromLibrary = false) => {
  // Nếu yêu cầu xóa khỏi thư viện (khi tắt SRS từ trang hệ thống)
  if (deleteFromLibrary && !isSrsEnabled) {
    // Xóa bản ghi khỏi user_saved_sets
    await FlashcardSetModel.saveSystemSet(userId, setId, 'UNSAVE');
    return;
  }
  
  // Ngược lại, chỉ cập nhật trạng thái SRS
  await FlashcardSetModel.toggleSrs(userId, setId, isSrsEnabled, dailyNewWords);
  
  if (isSrsEnabled) {
    const flashcards = await FlashcardModel.getFlashcardsBySet(setId);
    for (const card of flashcards) {
      await FlashcardModel.addToUserFlashcards(userId, card.id);
    }
  }
};

const saveSystemSet = async (userId, setId, action) => {
  const setDetail = await FlashcardSetModel.getSetById(setId, userId);
  if (!setDetail || !setDetail.is_system) throw new AppError(404, "Không tìm thấy bộ thẻ hệ thống.", "SYSTEM_SET_NOT_FOUND");
  await FlashcardSetModel.saveSystemSet(userId, setId, action);
};

// ==============================================================
// 1. HÀM CŨ DÀNH CHO BẠN CỦA BẠN (LƯU THẲNG VÀO DATABASE)
// ==============================================================
const createSetFromPdf = async (user, fileBuffer, fileName, title, description, serviceId) => {
  console.log("📄 Bắt đầu xử lý PDF (Direct Save):", fileName);
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  let numPages = 0;

  try {
    const pdfInfo = await extractTextFromPDF(fileBuffer);
    numPages = pdfInfo.numPages;
  } catch (err) { throw new AppError(400, err.message || "Không thể đọc file PDF.", "PDF_READ_ERROR"); }

  if (!isAdmin) {
    if (user.ai_quota <= 0) throw new AppError(429, "Bạn đã hết lượt sử dụng AI hôm nay.", "QUOTA_AI_EXCEEDED");
    if (user.role === "USER") {
      const docsThisMonth = await DocumentModel.countDocsInCurrentMonth(user.id);
      if (docsThisMonth >= 2) throw new AppError(403, "Tài khoản miễn phí chỉ được upload tối đa 2 file PDF/tháng.", "QUOTA_PDF_EXCEEDED");
      if (numPages > 5) throw new AppError(403, "Tài khoản miễn phí chỉ được upload PDF tối đa 5 trang.", "PDF_PAGE_LIMIT_EXCEEDED");
    }
  }

  const documentId = await DocumentModel.createDocument(user.id, fileName, numPages);
  let extractedFlashcards = [];
  try {
    extractedFlashcards = await GeminiService.extractVocabFromPdf(fileBuffer);
    if (!Array.isArray(extractedFlashcards)) extractedFlashcards = extractedFlashcards.flashcards || [];
  } catch (aiError) { throw new AppError(500, 'Lỗi AI trích xuất dữ liệu.', 'AI_EXTRACT_ERROR'); }

  const connection = await db.getConnection();
  const execTx = (sql, params) => new Promise((res, rej) => connection.execute(sql, params, (err, results) => {
    if (err) return rej(err);
    if (Array.isArray(results) && results.length > 0 && results[0] !== undefined) {
      if (Array.isArray(results[0])) return res(results[0]);
    }
    return res(results);
  }));
  const beginTx = () => new Promise((res, rej) => connection.beginTransaction((err) => (err ? rej(err) : res())));
  const commitTx = () => new Promise((res, rej) => connection.commit((err) => (err ? rej(err) : res())));
  const rollbackTx = () => new Promise((res) => connection.rollback(() => res()));

  let setId, totalExtracted = extractedFlashcards.length, totalSkipped = 0, finalCards = [];

  try {
    await beginTx();
    const setResult = await execTx(`INSERT INTO flashcard_sets (user_id, service_id, document_id, title, description, is_system) VALUES (?, ?, ?, ?, ?, FALSE)`, [user.id, serviceId, documentId, title, description || null]);
    setId = setResult.insertId;

    await execTx(`INSERT INTO user_saved_sets (user_id, set_id, is_srs_enabled, daily_new_words) VALUES (?, ?, FALSE, 20)`, [user.id, setId]);

    const existingRows = await execTx(`SELECT LOWER(f.word) AS word FROM flashcards f JOIN flashcard_sets fs ON f.set_id = fs.id WHERE fs.user_id = ?`, [user.id]);
    const wordsArray = Array.isArray(existingRows) ? existingRows : [];
    const userVocabSet = new Set(wordsArray.map((row) => row.word));

    for (const card of extractedFlashcards) {
      if (!card.word) continue;
      const cleanWord = card.word.trim().toLowerCase();
      if (userVocabSet.has(cleanWord)) { totalSkipped++; continue; }
      const insertCard = await execTx(
        `INSERT INTO flashcards (set_id, word, meaning, pronunciation, example_sentence, part_of_speech) VALUES (?, ?, ?, ?, ?, ?)`,
        [setId, card.word, card.meaning, card.pronunciation || null, card.example_sentence || null, card.part_of_speech || null]
      );
      card.id = insertCard.insertId;
      finalCards.push(card);
      userVocabSet.add(cleanWord);
    }

    if (!isAdmin) await execTx(`UPDATE users SET ai_quota = ai_quota - 1 WHERE id = ?`, [user.id]);
    await commitTx();
  } catch (error) { await rollbackTx(); throw error; } finally { connection.release(); }

  return { set_id: setId, set_title: title, total_extracted: totalExtracted, total_skipped_duplicate: totalSkipped, flashcards: finalCards };
};

// ==============================================================
// 2. HÀM MỚI DÀNH CHO BẠN (TRẢ VỀ PREVIEW CHƯA LƯU DB)
// ==============================================================
const createSetFromPdfPreview = async (user, fileBuffer, fileName, title, description, serviceId) => {
  console.log("📄 Bắt đầu xử lý PDF (Preview):", fileName);
  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  let numPages = 0;

  try {
    const pdfInfo = await extractTextFromPDF(fileBuffer);
    numPages = pdfInfo.numPages;
    console.log(`📄 [DEBUG] Số trang PDF: ${numPages}, User role: ${user.role}`);
  } catch (err) { throw new AppError(400, err.message || "Không thể đọc file PDF.", "PDF_READ_ERROR"); }

  if (!isAdmin) {
    if (user.ai_quota <= 0) throw new AppError(429, "Bạn đã hết lượt sử dụng AI hôm nay.", "QUOTA_AI_EXCEEDED");
    if (user.role === "USER") {
      const docsThisMonth = await DocumentModel.countDocsInCurrentMonth(user.id);
      if (docsThisMonth >= 2) throw new AppError(403, "Tài khoản miễn phí chỉ upload tối đa 2 file PDF/tháng.", "QUOTA_PDF_EXCEEDED");
      if (numPages > 5) throw new AppError(403, "Tài khoản miễn phí chỉ upload PDF tối đa 5 trang.", "PDF_PAGE_LIMIT_EXCEEDED");
    }
  }

  const documentId = await DocumentModel.createDocument(user.id, fileName, numPages);
  
  let extractedFlashcards = [];
  try {
    extractedFlashcards = await GeminiService.extractVocabFromPdf(fileBuffer);
    if (!Array.isArray(extractedFlashcards)) extractedFlashcards = extractedFlashcards.flashcards || [];
  } catch (aiError) { throw new AppError(500, 'Lỗi AI trích xuất dữ liệu.', 'AI_EXTRACT_ERROR'); }

  // TRANSACTION chỉ để trừ Quota và cập nhật trạng thái Document
  const connection = await db.getConnection();
  const execTx = (sql, params) => new Promise((res, rej) => connection.execute(sql, params, (err, results) => err ? rej(err) : res(results)));
  const beginTx = () => new Promise((res, rej) => connection.beginTransaction(err => err ? rej(err) : res()));
  const commitTx = () => new Promise((res, rej) => connection.commit(err => err ? rej(err) : res()));
  const rollbackTx = () => new Promise((res) => connection.rollback(() => res()));

  try {
    await beginTx();
    if (!isAdmin) await execTx(`UPDATE users SET ai_quota = ai_quota - 1 WHERE id = ?`, [user.id]);
    await execTx(`UPDATE documents SET status = 'COMPLETED' WHERE id = ?`, [documentId]);
    await commitTx();
  } catch (error) { await rollbackTx(); throw error; } finally { connection.release(); }

  return { set_title: title, total_extracted: extractedFlashcards.length, flashcards: extractedFlashcards };
};

const exportSetToFile = async (setId, userId, format) => {
  const setDetail = await FlashcardSetModel.getSetById(setId, userId);
  if (!setDetail) throw new AppError(404, 'Bộ thẻ không tồn tại', 'SET_NOT_FOUND');
  if (!setDetail.is_system && setDetail.user_id !== userId) {
    throw new AppError(403, 'Không có quyền truy cập bộ thẻ này', 'FORBIDDEN');
  }
  
  const flashcards = await FlashcardModel.getFlashcardsBySet(setId);
  if (flashcards.length === 0) throw new AppError(400, 'Bộ thẻ không có từ vựng nào', 'EMPTY_SET');

  const sheetData = flashcards.map(card => ({
    word: card.word,
    meaning: card.meaning,
    pronunciation: card.pronunciation || '',
    example_sentence: card.example_sentence || '',
    part_of_speech: card.part_of_speech || ''
  }));

  if (format === 'xlsx') {
    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Flashcards');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  } else {
    const csvRows = [
      ['word', 'meaning', 'pronunciation', 'example_sentence', 'part_of_speech'],
      ...sheetData.map(row => [
        row.word, row.meaning, row.pronunciation, row.example_sentence, row.part_of_speech
      ])
    ];
    const csvContent = csvRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    return Buffer.from('\uFEFF' + csvContent, 'utf-8');
  }
};

const getPersonalSets = async (userId, page, limit) => {
  const offset = (page - 1) * limit;
  const { sets, totalItems } = await FlashcardSetModel.getPersonalSets(userId, limit, offset);
  
  return { 
    sets, 
    pagination: { 
      current_page: page, 
      total_pages: Math.ceil(totalItems / limit), 
      total_items: totalItems, 
      limit 
    } 
  };
};

module.exports = {
  getUserSets, getSystemSets, getPersonalSets, createSet, getSetDetail, updateSet, deleteSet,
  toggleSrs, saveSystemSet, exportSetToFile, createSetFromPdf,
  createSetFromPdfPreview // <-- Nhớ export hàm mới của bạn ra
};