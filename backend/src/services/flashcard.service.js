// backend/src/services/flashcard.service.js
const FlashcardModel = require('../models/flashcard.model');
const FlashcardSetModel = require('../models/flashcardSet.model');
const AppError = require('../utils/appError');

const addFlashcard = async (userId, userRole, setId, word, meaning, pronunciation, example_sentence, part_of_speech) => {
  const setDetail = await FlashcardSetModel.getSetById(setId, userId);
  if (!setDetail) throw new AppError(404, 'Không tìm thấy bộ thẻ.', 'SET_NOT_FOUND');
  
  // Cho phép admin sửa bộ hệ thống
  const isAdmin = (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN');
  if (setDetail.is_system && !isAdmin) {
    throw new AppError(403, 'Không thể thêm từ vào bộ thẻ hệ thống.', 'CANNOT_UPDATE_SYSTEM_SET');
  }
  if (!setDetail.is_system && setDetail.user_id !== userId) {
    throw new AppError(403, 'Không có quyền thao tác.', 'AUTH_FORBIDDEN');
  }

  const existingWord = await FlashcardModel.checkDuplicateWord(setId, word);
  if (existingWord) {
    throw new AppError(409, `Từ '${word}' đã tồn tại trong bộ thẻ này.`, 'FLASHCARD_DUPLICATE_WORD');
  }

  const newCard = await FlashcardModel.addFlashcard(setId, word, meaning, pronunciation, example_sentence, part_of_speech);
  if (setDetail.is_srs_enabled) {
    await FlashcardModel.addToUserFlashcards(userId, newCard.id);
  }
  return newCard;
};

const updateFlashcard = async (userId, userRole, flashcardId, word, meaning, pronunciation, example_sentence, part_of_speech) => {
  const cardInfo = await FlashcardModel.getFlashcardById(flashcardId);
  if (!cardInfo) throw new AppError(404, 'Không tìm thấy thẻ từ vựng.', 'FLASHCARD_NOT_FOUND');
  
  const isAdmin = (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN');
  if (cardInfo.is_system && !isAdmin) {
    throw new AppError(403, 'Không thể sửa thẻ hệ thống.', 'CANNOT_EDIT_SYSTEM_CARD');
  }
  if (!cardInfo.is_system && cardInfo.user_id !== userId) {
    throw new AppError(403, 'Không có quyền thao tác.', 'AUTH_FORBIDDEN');
  }
  await FlashcardModel.updateFlashcard(flashcardId, word, meaning, pronunciation, example_sentence, part_of_speech);
};

const deleteFlashcard = async (userId, userRole, flashcardId) => {
  const cardInfo = await FlashcardModel.getFlashcardById(flashcardId);
  if (!cardInfo) throw new AppError(404, 'Không tìm thấy thẻ từ vựng.', 'FLASHCARD_NOT_FOUND');
  
  const isAdmin = (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN');
  if (cardInfo.is_system && !isAdmin) {
    throw new AppError(403, 'Không thể xóa thẻ hệ thống.', 'CANNOT_DELETE_SYSTEM_CARD');
  }
  if (!cardInfo.is_system && cardInfo.user_id !== userId) {
    throw new AppError(403, 'Không có quyền thao tác.', 'AUTH_FORBIDDEN');
  }
  await FlashcardModel.deleteFlashcard(flashcardId);
};

module.exports = {
  addFlashcard,
  updateFlashcard,
  deleteFlashcard,
};