const cron = require("node-cron");
const db = require("../config/database");
const { sendSrsReminderEmail } = require("../config/email");

const startSrsReminderJob = () => {
  console.log(
    "🚀 [CRON JOB - SRS] Đã đăng ký, sẽ chạy lúc 8:00 sáng hàng ngày theo giờ VN",
  );
  cron.schedule(
    "0 8 * * *",
    async () => {
      console.log(
        "⏰ [CRON JOB - SRS] Bắt đầu chạy lúc:",
        new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }),
      );
      try {
        const query = `
        SELECT u.id, u.email, u.full_name, COUNT(DISTINCT uf.id) AS due_count
        FROM users u
        JOIN user_flashcards uf ON u.id = uf.user_id
        JOIN flashcards f ON uf.flashcard_id = f.id
        JOIN flashcard_sets fs ON f.set_id = fs.id
        JOIN user_saved_sets uss ON uss.set_id = fs.id AND uss.user_id = u.id
        WHERE uf.next_review_date <= NOW()
          AND uss.is_srs_enabled = TRUE
          AND u.is_reminder_enabled = TRUE
          AND u.status = 'ACTIVE'
        GROUP BY u.id, u.email, u.full_name
        HAVING due_count > 0
      `;
        const [usersDue] = await db.query(query);
        console.log(
          `📊 [CRON JOB - SRS] Tìm thấy ${usersDue.length} user có bài đến hạn.`,
        );
        if (usersDue.length === 0) {
          console.log("✅ [CRON JOB - SRS] Không có ai cần nhắc.");
          return;
        }
        for (const user of usersDue) {
          console.log(
            `📧 Đang gửi email cho ${user.email} (${user.due_count} thẻ)`,
          );
          await sendSrsReminderEmail(
            user.email,
            user.full_name,
            user.due_count,
          );
        }
        console.log("✅ [CRON JOB - SRS] Đã gửi xong email.");
      } catch (error) {
        console.error("🔥 [CRON JOB LỖI - SRS]:", error);
      }
    },
    {
      timezone: "Asia/Ho_Chi_Minh",
    },
  );
  console.log(
    "🚀 Cron job SRS đã được đăng ký (chạy lúc 8:00 sáng hàng ngày theo giờ VN)",
  );
};

module.exports = startSrsReminderJob;
