require("dotenv").config();
const app = require("./app");
const { checkConnection } = require("./src/config/database");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // BẮT BUỘC: Đợi kết nối Database thành công rồi mới mở Port cho người dùng gọi API
  await checkConnection();

  app.listen(PORT, () => {
    console.log(`✅ Server đang chạy tại: http://localhost:${PORT}`);
    console.log(`✅ Auth API: http://localhost:${PORT}/api/v1/auth`);
  });
};

startServer();