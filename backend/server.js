require("dotenv").config();
const app = require("./app");
const { checkConnection } = require("./src/config/database");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await checkConnection();
    app.listen(PORT, () => {
      console.log(`✅ Server đang chạy tại: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Không thể khởi động server:", err.message);
    process.exit(1);
  }
};

startServer();