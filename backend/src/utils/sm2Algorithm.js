function calculateSM2(easeFactor, intervalDays, repetitionCount, rating) {
  const ratingMap = { AGAIN: 0, HARD: 1, GOOD: 3, EASY: 5 };
  const q = ratingMap[rating];

  let newEaseFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (newEaseFactor < 1.3) newEaseFactor = 1.3;

  let newInterval, newRepetition = repetitionCount;

  if (q < 2) {
    newInterval = 1; 
    newRepetition = 0;
  } else if (newRepetition === 0) {
    newInterval = 1; 
    newRepetition = 1;
  } else if (newRepetition === 1) {
    newInterval = 6; 
    newRepetition = 2;
  } else {
    newInterval = Math.round(intervalDays * newEaseFactor);
    newRepetition += 1;
  }

  // FIX LỖI TIMEZONE: Đưa về 00:00:00 chuẩn UTC để tránh lệch ngày
  const nextReviewDate = new Date();
  nextReviewDate.setUTCHours(0, 0, 0, 0); 
  nextReviewDate.setUTCDate(nextReviewDate.getUTCDate() + newInterval);

  return {
    easeFactor: parseFloat(newEaseFactor.toFixed(2)),
    intervalDays: newInterval,
    repetitionCount: newRepetition,
    nextReviewDate
  };
}

module.exports = { calculateSM2 };