process.env.TZ = 'Asia/Ho_Chi_Minh';
require("dotenv").config();
const app = require("./app");
const { checkConnection } = require("./src/config/database");

// 1. IMPORT HÀM GOM NHÓM CRON JOBS VÀO ĐÂY
const startAllCronJobs = require("./src/cron");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Đợi kết nối Database thành công
    await checkConnection();
    
    // 2. BẬT HỆ THỐNG CRON JOBS CHẠY NGẦM VÀO ĐÂY
    // (Phải để dưới checkConnection vì Cron Jobs cần gọi DB)
    startAllCronJobs();

    // Khởi động Express Server
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`✅ Server đang chạy tại: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Không thể khởi động server:", err.message);
    process.exit(1);
  }
};

startServer();