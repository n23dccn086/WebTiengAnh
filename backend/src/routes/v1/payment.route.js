const express = require("express");
const router = express.Router();
const { protect } = require("../../middlewares/auth.middleware");
const paymentController = require("../../controllers/payment.controller");

router.get("/webhooks/momo", (req, res) => {
  res.json({
    status: "success",
    message: "MoMo webhook route exists. Use POST for real webhook.",
  });
});

// API 1: Tạo giao dịch (Cần đăng nhập)
// Đổi tên cho ĐÚNG với hàm export trong controller
router.post("/momo", protect, paymentController.createMoMoPayment); 

// API 2: Webhook nhận kết quả từ MoMo (KHÔNG protect)
// Đổi tên cho ĐÚNG với hàm Radar export trong controller
router.post("/webhooks/momo", paymentController.handleMoMoWebhook);

module.exports = router;