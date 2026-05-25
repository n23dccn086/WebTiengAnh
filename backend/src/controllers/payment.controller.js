const PaymentService = require('../services/payment.service');
const catchAsync = require('../utils/catchAsync');
const { successResponse } = require('../utils/response.helper');

const createPayment = catchAsync(async (req, res) => {
  const data = await PaymentService.createMoMoPayment(req.user.id);
  return successResponse(res, "Tạo giao dịch thành công", data);
});

const momoWebhook = catchAsync(async (req, res) => {
  console.log('=== CONTROLLER WEBHOOK HIT ==='); // THÊM DÒNG NÀY
  console.log('Body:', JSON.stringify(req.body)); // THÊM DÒNG NÀY

  const isSuccess = await PaymentService.handleMoMoWebhook(req.body);

  // Theo tài liệu MoMo, khi IPN trả về, ta luôn phải nhả về HTTP 204 No Content
  // Hoặc nhả về status 200 để MoMo biết ta đã nhận được, không cần gọi lại nữa.
  if (isSuccess) {
    return res.status(200).json({ status: 0, message: "success" });
  } else {
    // Nếu ta trả về mã khác, MoMo sẽ gọi lại IPN này liên tục trong vài ngày
    return res.status(400).json({ status: -1, message: "failed" });
  }
});

module.exports = {
  createPayment,
  momoWebhook
};