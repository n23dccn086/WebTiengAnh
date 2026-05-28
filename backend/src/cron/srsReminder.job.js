const cron = require('node-cron');
const db = require('../config/database');
const { sendSrsReminderEmail } = require('../config/email');

const startSrsReminderJob = () => {
  cron.schedule('0 8 * * *', async () => {
    console.log('⏰ [CRON JOB - SRS]: Đang quét dữ liệu từ vựng cần ôn tập...');
    try {
      const query = `
        SELECT u.email, u.full_name, COUNT(DISTINCT uf.id) AS due_count
        FROM users u
        JOIN user_flashcards uf ON u.id = uf.user_id
        JOIN flashcards f ON uf.flashcard_id = f.id
        JOIN user_saved_sets uss ON uss.set_id = f.set_id AND uss.user_id = u.id
        WHERE uf.next_review_date <= NOW()
          AND uss.is_srs_enabled = TRUE
          AND u.is_reminder_enabled = TRUE
        GROUP BY u.id, u.email, u.full_name
        HAVING due_count > 0
      `;
      const [usersDue] = await db.query(query);
      if (usersDue.length === 0) {
        console.log('✅ [CRON JOB - SRS]: Hôm nay không có ai bị tồn đọng bài tập.');
        return;
      }
      console.log(`📧 [CRON JOB - SRS]: Phát hiện ${usersDue.length} User có bài tập. Đang gửi email...`);
      for (const user of usersDue) {
        await sendSrsReminderEmail(user.email, user.full_name, user.due_count);
      }
      console.log('✅ [CRON JOB - SRS]: Đã gửi xong toàn bộ email nhắc nhở!');
    } catch (error) {
      console.error('🔥 [CRON JOB LỖI - SRS]:', error);
    }
  }, {
    timezone: "Asia/Ho_Chi_Minh"  // Đảm bảo dòng này có
  });
};

module.exports = startSrsReminderJob;