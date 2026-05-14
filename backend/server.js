require('dotenv').config();
const app = require('./app');
const db = require('./src/config/database');

const PORT = process.env.PORT || 5000;

// Kiểm tra kết nối DB trước khi chạy server
(async () => {
  try {
    const connection = await db.getConnection();
    console.log('✅ Kết nối MySQL thành công');
    connection.release();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Lỗi kết nối database:', err);
    process.exit(1);
  }
})();