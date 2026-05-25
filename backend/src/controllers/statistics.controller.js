const db = require('../config/database');
const catchAsync = require('../utils/catchAsync');
const { successResponse } = require('../utils/response.helper');
const AppError = require('../utils/appError');

// GET /api/v1/statistics/dashboard
exports.getPremiumDashboard = catchAsync(async (req, res) => {
  const userId = req.user.id;

  // Kiểm tra user có phải Premium không (role = PREMIUM hoặc SUPER_ADMIN)
  if (req.user.role !== 'PREMIUM' && req.user.role !== 'SUPER_ADMIN') {
    throw new AppError(403, 'Bạn cần nâng cấp Premium để xem thống kê chi tiết.', 'PREMIUM_REQUIRED');
  }

  // 1. Lấy current_streak và last_active_date
  const [userRows] = await db.execute(
    `SELECT current_streak, last_active_date FROM users WHERE id = ?`,
    [userId]
  );
  const current_streak = userRows[0]?.current_streak || 0;

  // 2. Tổng số thẻ đã học (tất cả user_flashcards đã từng học, không phân biệt status)
  const [totalLearnedRows] = await db.execute(
    `SELECT COUNT(*) as total FROM user_flashcards WHERE user_id = ?`,
    [userId]
  );
  const total_learned = totalLearnedRows[0]?.total || 0;

  // 3. Số thẻ đến hạn hôm nay (next_review_date <= NOW() và is_srs_enabled = TRUE)
  const [dueTodayRows] = await db.execute(
    `SELECT COUNT(DISTINCT uf.id) as due_today
     FROM user_flashcards uf
     JOIN flashcards f ON uf.flashcard_id = f.id
     JOIN flashcard_sets fs ON f.set_id = fs.id
     JOIN user_saved_sets uss ON uss.set_id = fs.id AND uss.user_id = uf.user_id
     WHERE uf.user_id = ? 
       AND uf.next_review_date <= NOW() 
       AND uss.is_srs_enabled = TRUE`,
    [userId]
  );
  const due_today = dueTodayRows[0]?.due_today || 0;

  // 4. Biểu đồ tiến độ 7 ngày gần nhất: số thẻ đã ôn mỗi ngày (dựa trên last_reviewed_at)
  const [progressRows] = await db.execute(
    `SELECT DATE(last_reviewed_at) as date, COUNT(*) as reviewed
     FROM user_flashcards
     WHERE user_id = ? AND last_reviewed_at IS NOT NULL
       AND last_reviewed_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
     GROUP BY DATE(last_reviewed_at)
     ORDER BY date ASC`,
    [userId]
  );
  // Tạo mảng 7 ngày (từ hôm nay lùi 6 ngày)
  const progress_chart = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const found = progressRows.find(row => row.date.toISOString().split('T')[0] === dateStr);
    progress_chart.push({
      date: dateStr,
      reviewed: found ? parseInt(found.reviewed) : 0
    });
  }

  // 5. Top từ khó nhất (ease_factor thấp nhất, repetition_count cao nhất)
  const [hardestRows] = await db.execute(
    `SELECT f.word, f.meaning, uf.ease_factor, uf.repetition_count
     FROM user_flashcards uf
     JOIN flashcards f ON uf.flashcard_id = f.id
     WHERE uf.user_id = ? AND uf.ease_factor IS NOT NULL
     ORDER BY uf.ease_factor ASC, uf.repetition_count DESC
     LIMIT 5`,
    [userId]
  );

  const hardest_words = hardestRows.map(row => ({
    word: row.word,
    meaning: row.meaning,
    ease_factor: parseFloat(row.ease_factor),
    repetition_count: row.repetition_count
  }));

  return successResponse(res, 'Lấy thống kê thành công', {
    current_streak,
    total_learned,
    due_today,
    progress_chart,
    hardest_words
  });
});