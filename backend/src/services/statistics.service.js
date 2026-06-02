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

const getHomeStats = async (userId) => {
  // 1. Lấy Streak hiện tại
  const [userRow] = await db.execute(
    `SELECT current_streak FROM users WHERE id = ?`,
    [userId]
  );
  const current_streak = userRow[0]?.current_streak || 0;

  // 2. Số thẻ cần ôn tập hôm nay (chỉ tính những bộ thẻ đang bật is_srs_enabled)
  const [dueTodayRow] = await db.execute(
    `SELECT COUNT(DISTINCT uf.id) as due_today
     FROM user_flashcards uf
     JOIN flashcards f ON uf.flashcard_id = f.id
     JOIN flashcard_sets fs ON f.set_id = fs.id
     JOIN user_saved_sets uss ON uss.set_id = fs.id AND uss.user_id = uf.user_id
     WHERE uf.user_id = ? AND uf.next_review_date <= NOW() AND uss.is_srs_enabled = TRUE`,
    [userId]
  );
  const due_today = dueTodayRow[0]?.due_today || 0;

  return {
    current_streak,
    due_today
  };
};

// ✅ ĐÃ SỬA: ép kiểu limit, đảm bảo an toàn
const getLeaderboard = async (limit = 10) => {
  const safeLimit = parseInt(limit, 10);
  if (isNaN(safeLimit) || safeLimit <= 0) safeLimit = 10;
  const query = `
    SELECT 
      u.id, 
      u.email,
      u.full_name, 
      COALESCE(SUM(t.score), 0) AS total_score,
      COUNT(t.id) AS total_tests
    FROM users u
    LEFT JOIN test_attempts t ON u.id = t.user_id AND t.status = 'COMPLETED' AND t.score IS NOT NULL
    WHERE u.status = 'ACTIVE' 
      AND u.role_id IN (SELECT id FROM roles WHERE name IN ('USER', 'PREMIUM'))
    GROUP BY u.id, u.email, u.full_name
    HAVING total_tests > 0
    ORDER BY total_score DESC, total_tests ASC
    LIMIT ?
  `;
  const [rows] = await db.query(query, [safeLimit]);
  return rows;
};

module.exports = { getPremiumStats, getHomeStats, getLeaderboard };