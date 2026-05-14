require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authRoutes = require("./src/routes/v1/auth.route");
const userRoutes = require("./src/routes/v1/user.router");
const flashcardRoutes = require("./src/routes/v1/flashcard.route");

console.log("authRoutes:", typeof authRoutes);
console.log("userRoutes:", typeof userRoutes);
console.log("flashcardRoutes:", typeof flashcardRoutes);

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/flashcards", flashcardRoutes);

app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "Server đã chạy thành công!",
    data: {
      auth_api: "/api/v1/auth",
      users_api: "/api/v1/users",
      flashcards_api: "/api/v1/flashcards",
    },
  });
});

app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "API không tồn tại.",
    error_code: "ROUTE_NOT_FOUND",
  });
});

app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);

  res.status(500).json({
    status: "error",
    message: "Lỗi server.",
    error_code: "SERVER_ERROR",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server đang chạy tại: http://localhost:${PORT}`);
  console.log(`✅ Auth API: http://localhost:${PORT}/api/v1/auth`);
  console.log(`✅ Users API: http://localhost:${PORT}/api/v1/users`);
  console.log(`✅ Flashcards API: http://localhost:${PORT}/api/v1/flashcards`);
});
