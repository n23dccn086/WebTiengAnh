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
router.post("/momo", protect, paymentController.createPayment);

// API 2: Webhook nhận kết quả từ MoMo (KHÔNG DÙNG middleware protect vì MoMo gọi vào)
router.post("/webhooks/momo", paymentController.momoWebhook);

module.exports = router;
