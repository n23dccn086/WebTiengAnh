const SrsModel = require('../models/srs.model');
const UserModel = require('../models/user.model');
const { calculateSM2 } = require('../utils/sm2Algorithm');
const db = require('../config/database');
const AppError = require('../utils/appError');

const getTodayCards = async (userId) => {
  const cards = await SrsModel.getDueFlashcards(userId, 50);
  console.log(`[DEBUG] getTodayCards - userId: ${userId}, count: ${cards.length}`);
  return cards;
};

const reviewCard = async (userId, flashcardId, rating) => {
  const [rows] = await db.execute(
    `SELECT ease_factor, interval_days, repetition_count 
     FROM user_flashcards 
     WHERE user_id = ? AND flashcard_id = ?`,
    [userId, flashcardId]
  );
  if (rows.length === 0) {
    throw new AppError(404, 'Thẻ này không nằm trong danh sách học của bạn.', 'CARD_NOT_FOUND');
  }
  const currentStats = rows[0];
  const newStats = calculateSM2(
    currentStats.ease_factor,
    currentStats.interval_days,
    currentStats.repetition_count,
    rating
  );
  await SrsModel.updateFlashcardProgress(userId, flashcardId, newStats);
  if (rating === 'AGAIN') {
    await UserModel.updateSrsStreak(userId, 'RESET');
  } else {
    await UserModel.updateSrsStreak(userId, 'INCREMENT');
  }
  return newStats;
};

const learnNewCards = async (userId, limit) => {
  const user = await UserModel.findUserById(userId);
  if (!user) throw new AppError(404, 'User không tồn tại', 'USER_NOT_FOUND');

  // Kiểm tra có bộ thẻ nào đang bật SRS không
  const [enabledSets] = await db.query(
    `SELECT COUNT(*) as count FROM user_saved_sets WHERE user_id = ? AND is_srs_enabled = TRUE`,
    [userId]
  );
  if (enabledSets[0].count === 0) {
    return {
      message: 'Bạn chưa bật SRS cho bộ thẻ nào. Hãy vào Thư viện, chọn bộ thẻ và bật SRS trước.',
      added_count: 0,
      flashcards: []
    };
  }

  const newCardIds = await SrsModel.getNewCardIds(userId, limit);
  console.log(`[DEBUG] learnNewCards - userId: ${userId}, limit: ${limit}, found: ${newCardIds.length}`, newCardIds);

  if (newCardIds.length === 0) {
    const [existing] = await db.query(
      `SELECT COUNT(*) as count FROM user_flashcards WHERE user_id = ?`,
      [userId]
    );
    if (existing[0].count === 0) {
      return {
        message: 'Không tìm thấy từ mới. Hãy đảm bảo bạn đã bật SRS cho ít nhất một bộ thẻ có chứa từ vựng.',
        added_count: 0,
        flashcards: []
      };
    } else {
      return {
        message: 'Bạn đã học hết từ mới trong tất cả bộ thẻ đã bật SRS. Hãy thêm từ vựng mới hoặc bật SRS cho bộ thẻ khác.',
        added_count: 0,
        flashcards: []
      };
    }
  }

  await SrsModel.startLearningNewCards(userId, newCardIds);

  const [flashcards] = await db.query(
    `SELECT f.id, f.word, f.meaning, f.pronunciation, f.example_sentence, f.part_of_speech
     FROM flashcards f
     WHERE f.id IN (${newCardIds.map(() => '?').join(',')})`,
    newCardIds
  );

  return {
    message: `Đã thêm ${newCardIds.length} từ mới vào danh sách học hôm nay.`,
    added_count: newCardIds.length,
    flashcards
  };
};

module.exports = {
  getTodayCards,
  reviewCard,
  learnNewCards
};