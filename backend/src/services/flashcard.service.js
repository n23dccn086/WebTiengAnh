const FlashcardModel = require('../models/flashcard.model');
const FlashcardSetModel = require('../models/flashcardSet.model');
const AppError = require('../utils/appError');

const addFlashcard = async (userId, setId, word, meaning, pronunciation, example_sentence, part_of_speech) => {
  // 1. Kiểm tra bộ thẻ có tồn tại và thuộc quyền sở hữu không
  const setDetail = await FlashcardSetModel.getSetById(setId, userId);
  if (!setDetail) throw new AppError(404, 'Không tìm thấy bộ thẻ.', 'SET_NOT_FOUND');
  if (setDetail.is_system) throw new AppError(403, 'Không thể thêm từ vào bộ thẻ hệ thống.', 'CANNOT_UPDATE_SYSTEM_SET');
  if (setDetail.user_id !== userId) throw new AppError(403, 'Không có quyền thao tác.', 'AUTH_FORBIDDEN');

  // 2. Kiểm tra trùng lặp
  const existingWord = await FlashcardModel.checkDuplicateWord(setId, word);
  if (existingWord) {
    throw new AppError(409, `Từ '${word}' đã tồn tại trong bộ thẻ này.`, 'FLASHCARD_DUPLICATE_WORD');
  }

  // 3. Thêm mới
  const newCard = await FlashcardModel.addFlashcard(setId, word, meaning, pronunciation, example_sentence, part_of_speech);

  // 4. Nếu bộ thẻ đang bật SRS, nhét luôn từ mới này vào luồng học SRS
  if (setDetail.is_srs_enabled) {
    await FlashcardModel.addToUserFlashcards(userId, newCard.id);
  }

  return newCard;
};

const updateFlashcard = async (userId, flashcardId, word, meaning, pronunciation, example_sentence, part_of_speech) => {
  const cardInfo = await FlashcardModel.getFlashcardById(flashcardId);
  if (!cardInfo) throw new AppError(404, 'Không tìm thấy thẻ từ vựng.', 'FLASHCARD_NOT_FOUND');
  if (cardInfo.is_system) throw new AppError(403, 'Không thể sửa thẻ hệ thống.', 'CANNOT_EDIT_SYSTEM_CARD');
  if (cardInfo.user_id !== userId) throw new AppError(403, 'Không có quyền thao tác.', 'AUTH_FORBIDDEN');

  await FlashcardModel.updateFlashcard(flashcardId, word, meaning, pronunciation, example_sentence, part_of_speech);
};

const deleteFlashcard = async (userId, flashcardId) => {
  const cardInfo = await FlashcardModel.getFlashcardById(flashcardId);
  if (!cardInfo) throw new AppError(404, 'Không tìm thấy thẻ từ vựng.', 'FLASHCARD_NOT_FOUND');
  if (cardInfo.is_system) throw new AppError(403, 'Không thể xóa thẻ hệ thống.', 'CANNOT_DELETE_SYSTEM_CARD');
  if (cardInfo.user_id !== userId) throw new AppError(403, 'Không có quyền thao tác.', 'AUTH_FORBIDDEN');

  await FlashcardModel.deleteFlashcard(flashcardId);
};

module.exports = {
  addFlashcard,
  updateFlashcard,
  deleteFlashcard,
};