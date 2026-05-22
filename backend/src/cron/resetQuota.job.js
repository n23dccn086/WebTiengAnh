const cron = require('node-cron');
const db = require('../config/database');

const startResetQuotaJob = () => {
  // Chạy vào lúc 0h00 (nửa đêm) mỗi ngày
  cron.schedule('0 0 * * *', async () => {
    console.log('⏰ [CRON JOB - QUOTA]: Bắt đầu reset lượt dùng AI cho user...');
    try {
      // Ví dụ: Bơm 20 lượt cho tài khoản Thường (USER) và 100 lượt cho PREMIUM
      // Bạn có thể chỉnh lại con số theo thiết kế của team bạn nhé.
      await db.query(`
        UPDATE users 
        SET ai_quota = CASE 
          WHEN role_id = (SELECT id FROM roles WHERE name = 'PREMIUM') THEN 100
          WHEN role_id = (SELECT id FROM roles WHERE name = 'USER') THEN 20
          ELSE 0
        END,
        quota_reset_at = CURRENT_DATE
      `);

      console.log('✅ [CRON JOB - QUOTA]: Đã reset AI Quota thành công cho ngày mới!');
    } catch (error) {
      console.error('🔥 [CRON JOB LỖI - QUOTA]:', error);
    }
  });
};

module.exports = startResetQuotaJob;