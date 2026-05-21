const flashcardModel = require("../models/flashcard.model");
const userModel = require("../models/user.model");
const { updateFlashcardRating } = require("../utils/sm2Algorithm");

const getDueFlashcards = async (userId) => {
  return await flashcardModel.getDueFlashcards(userId);
};

const reviewFlashcard = async (userId, flashcardId, rating) => {
  // Lấy danh sách due cards (chỉ để kiểm tra thẻ có nằm trong danh sách due không)
  const dueCards = await flashcardModel.getDueFlashcards(userId);
  const card = dueCards.find(c => c.flashcard_id === flashcardId);
  if (!card) {
    throw new Error("Flashcard not found in user's queue or not due");
  }
  const { repetition_count, ease_factor, interval_days } = card;
  const newData = updateFlashcardRating(repetition_count, ease_factor, interval_days, rating);
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newData.interval_days);
  await flashcardModel.updateFlashcardProgress(userId, flashcardId, {
    repetition_count: newData.repetition_count,
    ease_factor: newData.ease_factor,
    interval_days: newData.interval_days,
    next_review_date: nextReviewDate,
    status: newData.status,
  });
  return newData;
};

const updateStreak = async (userId) => {
  const user = await userModel.findUserById(userId);
  const today = new Date().toISOString().slice(0,10);
  const lastActive = user.last_active_date ? user.last_active_date.toISOString().slice(0,10) : null;
  let newStreak = user.current_streak || 0;
  if (lastActive === today) {
    // no change
  } else if (lastActive === new Date(Date.now() - 86400000).toISOString().slice(0,10)) {
    newStreak += 1;
  } else {
    newStreak = 1;
  }
  await userModel.updateStreak(userId, newStreak, today);
  return newStreak;
};

module.exports = {
  getDueFlashcards,
  reviewFlashcard,
  updateStreak,
};