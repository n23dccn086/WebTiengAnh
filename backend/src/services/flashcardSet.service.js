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

const getSystemSets = async (userId) => {
  return await FlashcardSetModel.getSystemSets(userId);
};

const createSet = async (userId, title, description, serviceId) => {
  return await FlashcardSetModel.createSet(userId, title, description, serviceId);
};

const getSetDetail = async (setId, userId) => {
  const setDetail = await FlashcardSetModel.getSetById(setId, userId);
  if (!setDetail) {
    throw new AppError(404, 'Không tìm thấy bộ thẻ hoặc không có quyền truy cập.', 'SET_NOT_FOUND');
  }

  // Chặn user xem lén bộ thẻ của người khác (nếu không phải bộ hệ thống)
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

  // Logic cực hay của team bạn: Bật SRS thì phải bưng hết thẻ nhét vào luồng học (user_flashcards)
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

// [MỚI] Tích hợp AI bóc tách PDF
const createSetFromPdf = async (user, fileBuffer, fileName, title, serviceId) => {
  // 1. Kiểm tra Quota AI
  if (user.ai_quota <= 0) {
    throw new AppError(403, 'Bạn đã hết lượt sử dụng AI hôm nay. Vui lòng nâng cấp Premium hoặc quay lại vào ngày mai.', 'QUOTA_AI_EXCEEDED');
  }

  // 2. Kiểm tra giới hạn của Free User (Max 2 file/tháng)
  if (user.role === 'USER') {
    const docsThisMonth = await DocumentModel.countDocsInCurrentMonth(user.id);
    if (docsThisMonth >= 2) {
      throw new AppError(403, 'Tài khoản miễn phí chỉ được upload tối đa 2 file PDF/tháng.', 'QUOTA_PDF_EXCEEDED');
    }
  }

// 3. Đọc file PDF (Giờ chỉ lấy mỗi numPages)
  const { numPages } = await extractTextFromPDF(fileBuffer);
  
  // 4. Kiểm tra số trang (Free User max 5 trang)
  if (user.role === 'USER' && numPages > 5) {
    throw new AppError(403, 'Tài khoản miễn phí chỉ được upload PDF tối đa 5 trang.', 'PDF_PAGE_LIMIT_EXCEEDED');
  }

  // Lưu lịch sử upload document
  const documentId = await DocumentModel.createDocument(user.id, fileName, numPages);

// 5. Gọi Gemini trích xuất từ vựng (Sửa lại: Gọi hàm mới và truyền fileBuffer)
  const extractedFlashcards = await GeminiService.extractVocabFromPdf(fileBuffer);

  // if (!extractedFlashcards || extractedFlashcards.length === 0) {
  //   throw new AppError(400, 'AI không tìm thấy từ vựng học thuật nào trong file này.', 'NO_VOCAB_EXTRACTED');
  // }

  // 6. SQL Transaction: Lưu bộ thẻ và nhét toàn bộ Flashcard vào DB
  const connection = await db.getConnection();
  const execTx = (sql, params) => new Promise((res, rej) => connection.execute(sql, params, (err, results) => err ? rej(err) : res(results)));
  const beginTx = () => new Promise((res, rej) => connection.beginTransaction(err => err ? rej(err) : res()));
  const commitTx = () => new Promise((res, rej) => connection.commit(err => err ? rej(err) : res()));
  const rollbackTx = () => new Promise((res) => connection.rollback(() => res()));

  let setId;
  let totalExtracted = extractedFlashcards.length;
  let totalSkipped = 0;
  const finalCards = [];

  try {
    await beginTx();

    // 6.1 Tạo vỏ bộ thẻ (BỎ DẤU [] ĐI)
    const setResult = await execTx(
      `INSERT INTO flashcard_sets (user_id, service_id, document_id, title, is_system) VALUES (?, ?, ?, ?, FALSE)`,
      [user.id, serviceId, documentId, title]
    );
    setId = setResult.insertId;

    // 6.2 Bật chế độ mặc định trong bảng user_saved_sets
    await execTx(
      `INSERT INTO user_saved_sets (user_id, set_id, is_srs_enabled, daily_new_words) VALUES (?, ?, FALSE, 20)`,
      [user.id, setId]
    );

    // 6.3 Lấy danh sách từ vựng (BỎ DẤU [] ĐI để nhận nguyên một mảng các dòng)
    const existingWords = await execTx(
      `SELECT LOWER(f.word) AS word FROM flashcards f 
       JOIN flashcard_sets fs ON f.set_id = fs.id 
       WHERE fs.user_id = ?`, 
      [user.id]
    );
    const userVocabSet = new Set(existingWords.map(row => row.word));

    // Bọc thép: Đảm bảo Gemini luôn trả về mảng (phòng hờ nó trả về object {flashcards: []})
    const flashcardsArray = Array.isArray(extractedFlashcards) 
        ? extractedFlashcards 
        : (extractedFlashcards.flashcards || []);

    // 6.4 Lọc từ trùng và Insert các từ mới
    for (const card of flashcardsArray) {
      if (!card.word) continue;

      const cleanWord = card.word.trim().toLowerCase();
      // Nếu từ này User đã từng học/tạo rồi -> Bỏ qua
      if (userVocabSet.has(cleanWord)) {
        totalSkipped++;
        continue;
      }

      // BỎ DẤU [] ĐI
      const insertCard = await execTx(
        `INSERT INTO flashcards (set_id, word, meaning, pronunciation, example_sentence, part_of_speech) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [setId, card.word, card.meaning, card.pronunciation || null, card.example_sentence || null, card.part_of_speech || null]
      );
      
      card.id = insertCard.insertId;
      finalCards.push(card);
      userVocabSet.add(cleanWord);
    }

    // 6.5 Trừ Quota AI của user
    await execTx(`UPDATE users SET ai_quota = ai_quota - 1 WHERE id = ?`, [user.id]);

    await commitTx();
  } catch (error) {
    await rollbackTx();
    throw error;
  } finally {
    connection.release();
  }

  return {
    set_id: setId,
    set_title: title,
    total_extracted: totalExtracted,
    total_skipped_duplicate: totalSkipped,
    flashcards: finalCards
  };
};

module.exports = {
  getUserSets, getSystemSets, createSet, getSetDetail,
  updateSet, deleteSet, toggleSrs, saveSystemSet, createSetFromPdf
};