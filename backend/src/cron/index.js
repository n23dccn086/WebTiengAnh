const startSrsReminderJob = require('./srsReminder.job');
const startResetQuotaJob = require('./resetQuota.job');

const startAllCronJobs = () => {
  console.log('🚀 Đang khởi động hệ thống Cron Jobs...');
  startSrsReminderJob();
  startResetQuotaJob();
};

module.exports = startAllCronJobs;