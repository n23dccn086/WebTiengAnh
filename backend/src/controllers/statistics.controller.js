const db = require("../config/database");
const catchAsync = require("../utils/catchAsync");
const { successResponse } = require("../utils/response.helper");
const AppError = require("../utils/appError");
const StatisticsService = require("../services/statistics.service");

exports.getPremiumDashboard = catchAsync(async (req, res) => {
  
  const userId = req.user.id;

  if (req.user.role !== "PREMIUM" && req.user.role !== "SUPER_ADMIN") {
    throw new AppError(
      403,
      "Bạn cần nâng cấp Premium để xem thống kê chi tiết.",
      "PREMIUM_REQUIRED",
    );
  }

  // 1. Lấy streak
  const [userRows] = await db.execute(
    `SELECT current_streak FROM users WHERE id = ?`,
    [userId],
  );
  const current_streak = userRows[0]?.current_streak || 0;

  // 2. Tổng số từ đã học (tất cả user_flashcards)
  const [totalLearnedRows] = await db.execute(
    `SELECT COUNT(*) as total FROM user_flashcards WHERE user_id = ?`,
    [userId],
  );
  const total_learned = totalLearnedRows[0]?.total || 0;

  // 3. Thẻ đến hạn hôm nay – dùng UTC_TIMESTAMP() để tránh lệch múi giờ
  const [dueTodayRows] = await db.execute(
  `SELECT COUNT(DISTINCT uf.id) as due_today
   FROM user_flashcards uf
   JOIN flashcards f ON uf.flashcard_id = f.id
   JOIN flashcard_sets fs ON f.set_id = fs.id
   JOIN user_saved_sets uss ON fs.id = uss.set_id AND uss.user_id = uf.user_id
   WHERE uf.user_id = ? AND uf.next_review_date <= UTC_TIMESTAMP() AND uss.is_srs_enabled = TRUE`,
  [userId]
);
  const due_today = dueTodayRows[0]?.due_today || 0;

  // 4. Lấy dữ liệu review (last_reviewed_at) trong 7 ngày gần nhất theo giờ VN
  const [rawProgress] = await db.execute(
    `
    SELECT last_reviewed_at
    FROM user_flashcards
    WHERE user_id = ? AND last_reviewed_at IS NOT NULL
      AND last_reviewed_at >= DATE_SUB(UTC_TIMESTAMP(), INTERVAL 6 DAY)
  `,
    [userId],
  );

  const reviewMap = {};
  const offsetMs = 7 * 60 * 60 * 1000; // UTC+7
  rawProgress.forEach((row) => {
    const utcDate = new Date(row.last_reviewed_at);
    const vnDate = new Date(utcDate.getTime() + offsetMs);
    const dateStr = vnDate.toISOString().split("T")[0];
    reviewMap[dateStr] = (reviewMap[dateStr] || 0) + 1;
  });

  const todayVN = new Date(new Date().getTime() + offsetMs);
  const dates = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayVN);
    d.setUTCDate(todayVN.getUTCDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    dates.push(dateStr);
  }

  const progress_chart = dates.map((dateStr) => ({
    date: dateStr,
    reviewed: reviewMap[dateStr] || 0,
  }));

  // 5. Top từ hay quên (ease_factor thấp nhất)
  const [hardestRows] = await db.execute(
    `
    SELECT f.word, f.meaning, uf.ease_factor, uf.repetition_count
    FROM user_flashcards uf
    JOIN flashcards f ON uf.flashcard_id = f.id
    WHERE uf.user_id = ? AND uf.ease_factor IS NOT NULL
    ORDER BY uf.ease_factor ASC, uf.repetition_count DESC
    LIMIT 5
  `,
    [userId],
  );

  const hardest_words = hardestRows.map((row) => ({
    word: row.word,
    meaning: row.meaning,
    ease_factor: parseFloat(row.ease_factor).toFixed(2),
    repetition_count: row.repetition_count,
  }));

  return successResponse(res, "Lấy thống kê thành công", {
    current_streak,
    total_learned,
    due_today,
    progress_chart,
    hardest_words,
  });
});

exports.getHomeOverview = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const data = await StatisticsService.getHomeStats(userId);
  return successResponse(res, "Lấy thống kê tổng quan thành công", data);
});

// ✅ HÀM MỚI: Lấy bảng xếp hạng top người dùng theo điểm test
exports.getLeaderboard = catchAsync(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const data = await StatisticsService.getLeaderboard(limit);
  return successResponse(res, "Lấy bảng xếp hạng thành công", data);
});
