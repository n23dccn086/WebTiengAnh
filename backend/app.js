const express = require("express");
const cors = require("cors");
const errorMiddleware = require("./src/middlewares/error.middleware");
const AppError = require("./src/utils/appError");

const app = express();

// =========================
// CORS CONFIG
// =========================
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",

  // Domain frontend Railway cũ
  "https://frontend-production-6c8e.up.railway.app",

  // Domain frontend Railway mới
  "https://frontend-production-5b45.up.railway.app",

  // Domain frontend lấy từ biến môi trường Railway
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Cho phép request không có origin, ví dụ Postman, server-to-server
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));

// Không thêm app.options("*", cors()) vì dòng đó từng làm backend crash

app.use(express.json());

const routesV1 = require("./src/routes/v1/index");
app.use("/api/v1", routesV1);

app.use((req, res, next) => {
  next(
    new AppError(
      404,
      `Không tìm thấy API: ${req.originalUrl}`,
      "ROUTE_NOT_FOUND",
    ),
  );
});

app.use(errorMiddleware);

module.exports = app;
