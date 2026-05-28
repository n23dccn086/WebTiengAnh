const cron = require('node-cron');
const db = require('../config/database');

const startResetQuotaJob = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('⏰ [CRON JOB - QUOTA]: Bắt đầu reset lượt dùng AI...');
    try {
      // Reset AI quota cho USER và PREMIUM, còn ADMIN/SUPER_ADMIN set = 9999 (không giới hạn)
      await db.query(`
        UPDATE users 
        SET ai_quota = CASE 
          WHEN role_id = (SELECT id FROM roles WHERE name = 'PREMIUM') THEN 200
          WHEN role_id = (SELECT id FROM roles WHERE name = 'USER') THEN 10
          WHEN role_id IN (SELECT id FROM roles WHERE name IN ('ADMIN', 'SUPER_ADMIN')) THEN 9999
          ELSE ai_quota
        END,
        quota_reset_at = CURDATE()
        WHERE quota_reset_at < CURDATE() OR quota_reset_at IS NULL
      `);

      // Hạ cấp Premium khi hết hạn (chỉ áp dụng cho role PREMIUM)
      const [result] = await db.query(`
        UPDATE users 
        SET role_id = (SELECT id FROM roles WHERE name = 'USER')
        WHERE role_id = (SELECT id FROM roles WHERE name = 'PREMIUM')
          AND premium_until < NOW()
      `);
      if (result.affectedRows > 0) {
        console.log(`✅ [CRON JOB] Đã hạ cấp ${result.affectedRows} tài khoản Premium hết hạn.`);
      }

      console.log('✅ [CRON JOB - QUOTA] Thành công!');
    } catch (error) {
      console.error('🔥 Lỗi CRON JOB:', error);
    }
  });
};

module.exports = startResetQuotaJob;