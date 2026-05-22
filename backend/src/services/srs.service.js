const SrsModel = require('../models/srs.model');
const UserModel = require('../models/user.model');
const { calculateSM2 } = require('../utils/sm2Algorithm');
const db = require('../config/database');
const AppError = require('../utils/appError');

// API 7: Lấy từ cần ôn hôm nay
const getTodayCards = async (userId) => {
  // Giới hạn 50 từ mỗi lần gọi để Frontend không bị lag
  return await SrsModel.getDueFlashcards(userId, 50);
};

// API 8: Chấm điểm SRS và cập nhật Streak
const reviewCard = async (userId, flashcardId, rating) => {
  // 1. Lấy chỉ số hiện tại của thẻ
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

  // 2. Chạy thuật toán SM-2
  const newStats = calculateSM2(
    currentStats.ease_factor,
    currentStats.interval_days,
    currentStats.repetition_count,
    rating
  );

  // 3. Cập nhật vào Database
  await SrsModel.updateFlashcardProgress(userId, flashcardId, newStats);

  // 4. Logic Streak (Chuỗi ngày học)
  // Nếu bấm AGAIN (Quên), reset chuỗi về 0. Nếu khác, tăng chuỗi.
  if (rating === 'AGAIN') {
    await UserModel.updateSrsStreak(userId, 'RESET');     // Sửa ở đây
  } else {
    await UserModel.updateSrsStreak(userId, 'INCREMENT'); // Và sửa ở đây
  }

  return newStats;
};

// API 9 & 10: Bắt đầu học & Kéo thêm từ mới
const learnNewCards = async (userId, limit) => {
  // Lấy danh sách ID của các thẻ đang ở trạng thái 'NEW' (Chưa học bao giờ)
  const newCardIds = await SrsModel.getNewCardIds(userId, limit);
  
  if (newCardIds.length === 0) {
    return { message: 'Bạn không còn từ mới nào để học trong các bộ thẻ đang bật SRS.' };
  }

  // Đổi trạng thái từ NEW -> LEARNING và gắn hạn review là ngay bây giờ (NOW)
  await SrsModel.startLearningNewCards(userId, newCardIds);

  return { 
    message: `Đã thêm ${newCardIds.length} từ mới vào danh sách học hôm nay.`,
    added_count: newCardIds.length 
  };
};

module.exports = {
  getTodayCards,
  reviewCard,
  learnNewCards
};