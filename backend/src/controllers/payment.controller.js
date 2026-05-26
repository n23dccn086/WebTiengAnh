const PaymentService = require('../services/payment.service');
const catchAsync = require('../utils/catchAsync');
const { successResponse } = require('../utils/response.helper');
const AppError = require('../utils/appError');

const createPayment = catchAsync(async (req, res) => {
  const data = await PaymentService.createMoMoPayment(req.user.id);
  return successResponse(res, "Tạo giao dịch thành công", data);
});

const momoWebhook = catchAsync(async (req, res) => {
  console.log('=== CONTROLLER WEBHOOK HIT ===');
  console.log('Body:', JSON.stringify(req.body));

  const isSuccess = await PaymentService.handleMoMoWebhook(req.body);

  if (isSuccess) {
    return res.status(200).json({ status: 0, message: "success" });
  } else {
    return res.status(400).json({ status: -1, message: "failed" });
  }
});

const verifyMomoPayment = catchAsync(async (req, res) => {
  const { orderId, resultCode } = req.query;
  console.log("=== VERIFY HIT ===", req.query);

  if (!orderId) throw new AppError(400, 'Thiếu orderId', 'BAD_REQUEST');

  const result = await PaymentService.verifyMomoPayment(orderId, resultCode);
  return successResponse(res, "Xác minh thanh toán thành công", result);
});

const momoRedirect = catchAsync(async (req, res) => {
  const { orderId, resultCode } = req.query;
  console.log("=== MOMO REDIRECT HIT ===", req.query);

  if (!orderId) throw new AppError(400, 'Thiếu orderId', 'BAD_REQUEST');

  await PaymentService.verifyMomoPayment(orderId, resultCode);

  const frontendUrl = process.env.FRONTEND_URL;
  if (Number(resultCode) === 0) {
    return res.redirect(`${frontendUrl}/payment/result?status=success`);
  } else {
    return res.redirect(`${frontendUrl}/payment/result?status=failed`);
  }
});

module.exports = {
  createPayment,
  momoWebhook,
  verifyMomoPayment,
  momoRedirect
};