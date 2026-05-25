const express = require("express");
const router = express.Router();
const { protect } = require("../../middlewares/auth.middleware");
const paymentController = require("../../controllers/payment.controller");

router.get("/webhooks/momo", (req, res) => {
  res.json({ status: "success", message: "MoMo webhook route exists." });
});

// API 1: Tạo giao dịch 
router.post("/momo", protect, paymentController.createPayment);

// API 2: Webhook nhận kết quả từ MoMo (Sửa lại gọi ĐÚNG hàm momoWebhook)
router.post("/webhooks/momo", paymentController.momoWebhook);

module.exports = router;