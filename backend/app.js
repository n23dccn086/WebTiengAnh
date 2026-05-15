// File: backend/app.js
const express = require('express');
const cors = require('cors');
const errorMiddleware = require('./src/middlewares/error.middleware');
const AppError = require('./src/utils/appError');

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());

// ==========================================
// 1. ĐÓN KHÁCH (PHẢI NẰM Ở ĐÂY)
// ==========================================
const routesV1 = require('./src/routes/v1/index');
app.use('/api/v1', routesV1);

// ==========================================
// 2. BẪY LỖI 404 (Nếu khách gọi sai đường dẫn thì mới lọt xuống đây)
// ==========================================
app.use((req, res, next) => {
  next(new AppError(404, `Không tìm thấy API: ${req.originalUrl}`, "ROUTE_NOT_FOUND"));
});

// ==========================================
// 3. TRẠM THU GOM RÁC CỦA HỆ THỐNG
// ==========================================
app.use(errorMiddleware);

module.exports = app;