const db = require('../config/database');

const getPremiumStats = async (userId) => {
  // 1. Lấy current_streak và last_active_date
  const [userRow] = await db.execute(
    `SELECT current_streak, last_active_date FROM users WHERE id = ?`,
    [userId]
  );
  const current_streak = userRow[0]?.current_streak || 0;

  // 2. Tổng số từ đã học (tất cả flashcard trong user_flashcards)
  const [totalLearnedRow] = await db.execute(
    `SELECT COUNT(*) as total FROM user_flashcards WHERE user_id = ?`,
    [userId]
  );
  const total_learned = totalLearnedRow[0]?.total || 0;

  // 3. Số thẻ đến hạn hôm nay
  const [dueTodayRow] = await db.execute(
    `SELECT COUNT(*) as due FROM user_flashcards 
     WHERE user_id = ? AND next_review_date <= NOW()`,
    [userId]
  );
  const due_today = dueTodayRow[0]?.due || 0;

  // 4. Biểu đồ tiến độ 7 ngày gần nhất (số thẻ đã review mỗi ngày)
  const [chartData] = await db.execute(`
    SELECT DATE(last_reviewed_at) as date, COUNT(*) as reviewed
    FROM user_flashcards
    WHERE user_id = ? AND last_reviewed_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    GROUP BY DATE(last_reviewed_at)
    ORDER BY date ASC
  `, [userId]);

  // 5. Top 5 từ khó nhất (ease_factor thấp nhất, repetition_count cao)
  const [hardestWords] = await db.execute(`
    SELECT f.word, f.meaning, uf.ease_factor, uf.repetition_count
    FROM user_flashcards uf
    JOIN flashcards f ON uf.flashcard_id = f.id
    WHERE uf.user_id = ? AND uf.ease_factor IS NOT NULL
    ORDER BY uf.ease_factor ASC, uf.repetition_count DESC
    LIMIT 5
  `, [userId]);

  return {
    current_streak,
    total_learned,
    due_today,
    progress_chart: chartData,
    hardest_words: hardestWords
  };
};

module.exports = { getPremiumStats };