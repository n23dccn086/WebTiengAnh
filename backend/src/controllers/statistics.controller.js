const db = require('../config/database');
const catchAsync = require('../utils/catchAsync');
const { successResponse } = require('../utils/response.helper');
const AppError = require('../utils/appError');

exports.getPremiumDashboard = catchAsync(async (req, res) => {
  const userId = req.user.id;

  if (req.user.role !== 'PREMIUM' && req.user.role !== 'SUPER_ADMIN') {
    throw new AppError(403, 'Bạn cần nâng cấp Premium để xem thống kê chi tiết.', 'PREMIUM_REQUIRED');
  }

  // 1. current_streak
  const [userRows] = await db.execute(`SELECT current_streak FROM users WHERE id = ?`, [userId]);
  const current_streak = userRows[0]?.current_streak || 0;

  // 2. Tổng số thẻ đã học
  const [totalLearnedRows] = await db.execute(`SELECT COUNT(*) as total FROM user_flashcards WHERE user_id = ?`, [userId]);
  const total_learned = totalLearnedRows[0]?.total || 0;

  // 3. Số thẻ đến hạn hôm nay
  const [dueTodayRows] = await db.execute(`
    SELECT COUNT(DISTINCT uf.id) as due_today
    FROM user_flashcards uf
    JOIN flashcards f ON uf.flashcard_id = f.id
    JOIN flashcard_sets fs ON f.set_id = fs.id
    JOIN user_saved_sets uss ON uss.set_id = fs.id AND uss.user_id = uf.user_id
    WHERE uf.user_id = ? AND uf.next_review_date <= NOW() AND uss.is_srs_enabled = TRUE
  `, [userId]);
  const due_today = dueTodayRows[0]?.due_today || 0;

  // 4. Lấy dữ liệu các ngày có review (đã convert sang VN)
  const [rawProgress] = await db.execute(`
    SELECT 
      DATE(CONVERT_TZ(last_reviewed_at, '+00:00', '+07:00')) as date,
      COUNT(*) as reviewed
    FROM user_flashcards
    WHERE user_id = ? AND last_reviewed_at IS NOT NULL
    GROUP BY DATE(CONVERT_TZ(last_reviewed_at, '+00:00', '+07:00'))
    ORDER BY date ASC
  `, [userId]);

  // Tạo map dữ liệu
  const reviewMap = {};
  rawProgress.forEach(row => {
    reviewMap[row.date] = parseInt(row.reviewed);
  });

  // Xác định ngày lớn nhất (gần đây nhất) từ dữ liệu, nếu không có thì lấy ngày hiện tại VN
  let maxDate;
  if (rawProgress.length > 0) {
    maxDate = new Date(rawProgress[rawProgress.length - 1].date);
  } else {
    const now = new Date();
    const vnTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    maxDate = vnTime;
  }
  // Đặt về 0h để so sánh
  maxDate.setHours(0, 0, 0, 0);

  // Tạo mảng 7 ngày, từ maxDate lùi 6 ngày
  const progress_chart = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(maxDate);
    d.setDate(maxDate.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    progress_chart.push({
      date: dateStr,
      reviewed: reviewMap[dateStr] || 0
    });
  }

  // 5. Top từ khó nhất
  const [hardestRows] = await db.execute(`
    SELECT f.word, f.meaning, uf.ease_factor, uf.repetition_count
    FROM user_flashcards uf
    JOIN flashcards f ON uf.flashcard_id = f.id
    WHERE uf.user_id = ? AND uf.ease_factor IS NOT NULL
    ORDER BY uf.ease_factor ASC, uf.repetition_count DESC
    LIMIT 5
  `, [userId]);

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