const FlashcardSetModel = require('../models/flashcardSet.model');
const FlashcardModel = require('../models/flashcard.model');
const UserModel = require('../models/user.model');
const DocumentModel = require('../models/document.model');
const GeminiService = require('./gemini.service');
const extractTextFromPDF = require('../utils/pdfExtract');
const AppError = require('../utils/appError');
const db = require('../config/database');

const getUserSets = async (userId, page, limit, serviceId) => {
  const offset = (page - 1) * limit;
  const { sets, totalItems } = await FlashcardSetModel.getSetsByUser(userId, limit, offset);
  const totalPages = Math.ceil(totalItems / limit);
  return { sets, pagination: { current_page: page, total_pages: totalPages, total_items: totalItems, limit } };
};

const getSystemSets = async (userId, serviceId = null) => {
  let query = `
    SELECT fs.id, fs.title, fs.description, s.title AS service_title,
           COUNT(DISTINCT f.id) AS total_cards,
           IF(MAX(uss.set_id) IS NOT NULL, TRUE, FALSE) AS is_saved
    FROM flashcard_sets fs
    LEFT JOIN services s ON fs.service_id = s.id
    LEFT JOIN flashcards f ON fs.id = f.set_id
    LEFT JOIN user_saved_sets uss ON fs.id = uss.set_id AND uss.user_id = ?
    WHERE fs.is_system = TRUE
  `;
  const params = [userId];
  if (serviceId) {
    query += ` AND fs.service_id = ?`;
    params.push(serviceId);
  }
  query += ` GROUP BY fs.id, fs.title, fs.description, s.title ORDER BY fs.created_at DESC`;
  const [rows] = await db.execute(query, params);
  return rows;
};

// ========== SỬA LỖI GROUP BY ==========
const getPersonalSets = async (userId, page, limit) => {
  const offset = (page - 1) * limit;
  const [sets] = await db.query(
    `SELECT fs.id, fs.title, fs.description, fs.is_system, fs.created_at,
            s.title AS service_title,
            COALESCE(MAX(uss.is_srs_enabled), 0) AS is_srs_enabled,
            COUNT(DISTINCT f.id) AS total_cards
     FROM flashcard_sets fs
     LEFT JOIN services s ON fs.service_id = s.id
     LEFT JOIN flashcards f ON fs.id = f.set_id
     LEFT JOIN user_saved_sets uss ON fs.id = uss.set_id AND uss.user_id = ?
     WHERE fs.user_id = ? AND fs.is_system = FALSE
     GROUP BY fs.id, fs.title, fs.description, fs.is_system, fs.created_at, s.title
     ORDER BY fs.created_at DESC
     LIMIT ? OFFSET ?`,
    [userId, userId, limit, offset]
  );
  const [countResult] = await db.query(
    `SELECT COUNT(*) as total FROM flashcard_sets WHERE user_id = ? AND is_system = FALSE`,
    [userId]
  );
  const totalItems = countResult[0]?.total || 0;
  const totalPages = Math.ceil(totalItems / limit);
  return { sets, pagination: { current_page: page, total_pages: totalPages, total_items: totalItems, limit } };
};
// =====================================

const createSet = async (userId, title, description, serviceId) => {
  return await FlashcardSetModel.createSet(userId, title, description, serviceId);
};

const getSetDetail = async (setId, userId) => {
  const setDetail = await FlashcardSetModel.getSetById(setId, userId);
  if (!setDetail) throw new AppError(404, 'Không tìm thấy bộ thẻ hoặc không có quyền truy cập.', 'SET_NOT_FOUND');
  if (!setDetail.is_system && setDetail.user_id !== userId) {
    throw new AppError(403, 'Bạn không có quyền xem bộ thẻ này.', 'AUTH_FORBIDDEN');
  }
  const flashcards = await FlashcardModel.getFlashcardsBySet(setId);
  setDetail.total_cards = flashcards.length;
  setDetail.flashcards = flashcards;
  return setDetail;
};

const updateSet = async (setId, userId, title, description) => {
  const setDetail = await FlashcardSetModel.getSetById(setId, userId);
  if (!setDetail) throw new AppError(404, 'Không tìm thấy bộ thẻ.', 'SET_NOT_FOUND');
  if (setDetail.is_system) throw new AppError(403, 'Không thể sửa bộ thẻ hệ thống.', 'CANNOT_EDIT_SYSTEM_SET');
  if (setDetail.user_id !== userId) throw new AppError(403, 'Không có quyền sửa bộ thẻ này.', 'AUTH_FORBIDDEN');
  await FlashcardSetModel.updateSet(setId, title, description);
};

const deleteSet = async (setId, userId) => {
  const setDetail = await FlashcardSetModel.getSetById(setId, userId);
  if (!setDetail) throw new AppError(404, 'Không tìm thấy bộ thẻ.', 'SET_NOT_FOUND');
  if (setDetail.is_system) throw new AppError(403, 'Không thể xóa bộ thẻ hệ thống.', 'CANNOT_DELETE_SYSTEM_SET');
  if (setDetail.user_id !== userId) throw new AppError(403, 'Không có quyền xóa.', 'AUTH_FORBIDDEN');
  await FlashcardSetModel.deleteSet(setId);
};

const toggleSrs = async (userId, setId, isSrsEnabled, dailyNewWords) => {
  const setDetail = await FlashcardSetModel.getSetById(setId, userId);
  if (!setDetail) throw new AppError(404, 'Không tìm thấy bộ thẻ.', 'SET_NOT_FOUND');
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
  if (!setDetail || !setDetail.is_system) {
    throw new AppError(404, 'Không tìm thấy bộ thẻ hệ thống.', 'SYSTEM_SET_NOT_FOUND');
  }
  await FlashcardSetModel.saveSystemSet(userId, setId, action);
};

const createSetFromPdf = async (user, fileBuffer, fileName, title, description, serviceId) => {
  console.log("📄 Bắt đầu xử lý PDF:", fileName);
  if (user.ai_quota <= 0) {
    throw new AppError(403, 'Bạn đã hết lượt sử dụng AI hôm nay.', 'QUOTA_AI_EXCEEDED');
  }
  if (user.role === 'USER') {
    const docsThisMonth = await DocumentModel.countDocsInCurrentMonth(user.id);
    if (docsThisMonth >= 2) {
      throw new AppError(403, 'Tài khoản miễn phí chỉ được upload tối đa 2 file PDF/tháng.', 'QUOTA_PDF_EXCEEDED');
    }
  }
  const { numPages } = await extractTextFromPDF(fileBuffer);
  if (user.role === 'USER' && numPages > 5) {
    throw new AppError(403, 'Tài khoản miễn phí chỉ được upload PDF tối đa 5 trang.', 'PDF_PAGE_LIMIT_EXCEEDED');
  }
  const documentId = await DocumentModel.createDocument(user.id, fileName, numPages);
  let extractedFlashcards = [];
  try {
    extractedFlashcards = await GeminiService.extractVocabFromPdf(fileBuffer);
    if (!Array.isArray(extractedFlashcards)) extractedFlashcards = extractedFlashcards.flashcards || [];
  } catch (aiError) {
    console.error("❌ Lỗi Gemini:", aiError.message);
  }
  const connection = await db.getConnection();
  const execTx = (sql, params) => new Promise((res, rej) => connection.execute(sql, params, (err, results) => err ? rej(err) : res(results)));
  const beginTx = () => new Promise((res, rej) => connection.beginTransaction(err => err ? rej(err) : res()));
  const commitTx = () => new Promise((res, rej) => connection.commit(err => err ? rej(err) : res()));
  const rollbackTx = () => new Promise((res) => connection.rollback(() => res()));
  let setId, totalExtracted = extractedFlashcards.length, totalSkipped = 0, finalCards = [];
  try {
    await beginTx();
    const setResult = await execTx(
      `INSERT INTO flashcard_sets (user_id, service_id, document_id, title, description, is_system) VALUES (?, ?, ?, ?, ?, FALSE)`,
      [user.id, serviceId, documentId, title, description || null]
    );
    setId = setResult.insertId;
    await execTx(`INSERT INTO user_saved_sets (user_id, set_id, is_srs_enabled, daily_new_words) VALUES (?, ?, FALSE, 20)`, [user.id, setId]);
    const existingWords = await execTx(
      `SELECT LOWER(f.word) AS word FROM flashcards f JOIN flashcard_sets fs ON f.set_id = fs.id WHERE fs.user_id = ?`,
      [user.id]
    );
    const userVocabSet = new Set(existingWords.map(row => row.word));
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
    await execTx(`UPDATE users SET ai_quota = ai_quota - 1 WHERE id = ?`, [user.id]);
    await commitTx();
  } catch (error) {
    await rollbackTx();
    throw error;
  } finally {
    connection.release();
  }
  return { set_id: setId, set_title: title, total_extracted: totalExtracted, total_skipped_duplicate: totalSkipped, flashcards: finalCards };
};

module.exports = {
  getUserSets, getSystemSets, getPersonalSets, createSet, getSetDetail,
  updateSet, deleteSet, toggleSrs, saveSystemSet, createSetFromPdf
};