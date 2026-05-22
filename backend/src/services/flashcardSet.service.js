const FlashcardSetModel = require('../models/flashcardSet.model');
const FlashcardModel = require('../models/flashcard.model');
const AppError = require('../utils/appError');

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

module.exports = {
  getUserSets, getSystemSets, createSet, getSetDetail,
  updateSet, deleteSet, toggleSrs, saveSystemSet
};