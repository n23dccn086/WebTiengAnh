/**
 * Cập nhật thông số SM-2 cho flashcard
 * @param {number} repetitionCount - số lần lặp lại hiện tại
 * @param {number} easeFactor - hệ số dễ (mặc định 2.5)
 * @param {number} intervalDays - khoảng cách ngày hiện tại
 * @param {string} rating - 'again', 'hard', 'good', 'easy'
 * @returns {object} { repetition_count, ease_factor, interval_days, status }
 */
function updateFlashcardRating(repetitionCount, easeFactor, intervalDays, rating) {
  let newRepetition = repetitionCount;
  let newEase = easeFactor;
  let newInterval = intervalDays;

  switch (rating) {
    case 'again':
      newRepetition = 0;
      newInterval = 1;
      newEase = Math.max(1.3, easeFactor - 0.2);
      break;
    case 'hard':
      newRepetition = repetitionCount;
      newInterval = Math.max(1, Math.floor(intervalDays * 0.8));
      newEase = Math.max(1.3, easeFactor - 0.15);
      break;
    case 'good':
      newRepetition = repetitionCount + 1;
      if (newRepetition === 1) newInterval = 1;
      else if (newRepetition === 2) newInterval = 6;
      else newInterval = Math.round(intervalDays * easeFactor);
      break;
    case 'easy':
      newRepetition = repetitionCount + 1;
      if (newRepetition === 1) newInterval = 4;
      else newInterval = Math.round(intervalDays * easeFactor * 1.3);
      newEase = easeFactor + 0.15;
      break;
    default:
      throw new Error('Invalid rating');
  }
  let status = 'NEW';
  if (newRepetition > 0) status = 'LEARNING';
  if (newInterval >= 21) status = 'REVIEW';
  return { repetition_count: newRepetition, ease_factor: newEase, interval_days: newInterval, status };
}

module.exports = { updateFlashcardRating };