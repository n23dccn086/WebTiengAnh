const express = require("express");
const cors = require("cors");

const errorMiddleware = require("./src/middlewares/error.middleware");
const AppError = require("./src/utils/appError");

const app = express();

// =========================
// TRUST PROXY - dùng tốt hơn khi deploy Railway
// =========================
app.set("trust proxy", 1);

// =========================
// CORS CONFIG
// =========================
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",

  // Frontend Railway cũ
  "https://frontend-production-6c8e.up.railway.app",

  // Frontend Railway mới
  "https://frontend-production-5b45.up.railway.app",

  // Lấy thêm từ biến môi trường Railway
  process.env.FRONTEND_URL,

  // Nếu sau này muốn thêm nhiều domain:
  // CORS_ORIGINS=https://domain1.com,https://domain2.com
  ...(process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
    : []),
].filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // Cho phép request không có Origin: Postman, curl, MoMo webhook, server-to-server
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.error("❌ CORS blocked origin:", origin);
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));

// =========================
// BODY PARSER
// =========================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =========================
// HEALTH CHECK
// =========================
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Backend EngVocab đang hoạt động.",
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server healthy",
    timestamp: new Date().toISOString(),
  });
});

// Route này dùng để kiểm tra Railway đã chạy đúng code mới chưa
app.get("/api/v1/debug-version", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Backend latest code is running",
    version: "momo-webhook-debug-001",
    momoWebhook: "/api/v1/payments/webhooks/momo",
    frontendUrl: process.env.FRONTEND_URL || null,
    allowedOrigins,
  });
});

// =========================
// ROUTES V1
// =========================
const routesV1 = require("./src/routes/v1/index");
app.use("/api/v1", routesV1);

// =========================
// 404 HANDLER
// =========================
app.use((req, res, next) => {
  next(
    new AppError(
      404,
      `Không tìm thấy API: ${req.originalUrl}`,
      "ROUTE_NOT_FOUND",
    ),
  );
});

// =========================
// ERROR HANDLER
// =========================
app.use(errorMiddleware);

module.exports = app;
