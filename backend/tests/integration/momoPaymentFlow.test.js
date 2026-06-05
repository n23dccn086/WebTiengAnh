// File: tests/integration/momoPaymentFlow.test.js
const request = require('supertest');
const express = require('express');

// 1. MOCK MIDDLEWARE: Bỏ qua kiểm tra Token khi tạo link thanh toán
jest.mock('../../src/middlewares/auth.middleware', () => ({
  protect: (req, res, next) => {
    req.user = { id: 1, role: 'USER' };
    next();
  }
}));

// 2. MOCK SERVICE: Giả lập Service Thanh toán
jest.mock('../../src/services/payment.service', () => ({
  createMoMoPayment: jest.fn().mockResolvedValue({
    payUrl: 'https://test-payment.momo.vn/v2/gateway/pay?id=123',
    transaction_ref: 'EDTECH_123456_1'
  }),
  // Giả lập Webhook xử lý thành công
  handleMoMoWebhook: jest.fn().mockResolvedValue(true) 
}));

// LƯU Ý: Đổi tên file route này cho khớp với source code của bạn nếu cần
const paymentRoutes = require('../../src/routes/v1/payment.route');

const app = express();
app.use(express.json());
app.use('/api/v1/payments', paymentRoutes);

describe('Kiểm thử tích hợp (Integration Test) - Luồng Thanh Toán MoMo', () => {
  const mockOrderId = 'EDTECH_123456_1';

  test('Bước 1: POST /api/v1/payments/momo - User yêu cầu tạo mã QR thanh toán', async () => {
    const response = await request(app)
      .post('/api/v1/payments/momo');

    // Chỗ này kiểm tra status code 200 hay 201 tùy thuộc vào controller của bạn
    expect([200, 201]).toContain(response.status); 
    expect(response.body.data).toHaveProperty('payUrl');
    expect(response.body.data.payUrl).toContain('momo.vn');
    expect(response.body.data.transaction_ref).toBe(mockOrderId);
  });

  test('Bước 2: POST /api/v1/payments/momo/webhook - MoMo gọi IPN báo tiền đã vào tài khoản', async () => {
    // Giả lập Payload chuẩn mà server MoMo thực tế sẽ ném về server của bạn
    const webhookPayload = {
      partnerCode: "MOMO_TEST",
      orderId: mockOrderId,
      requestId: mockOrderId,
      amount: 49000,
      orderInfo: "Nang cap tai khoan Premium 1 Thang",
      transId: 2500000000,
      resultCode: 0, // 0 nghĩa là giao dịch thành công
      message: "Successful.",
      payType: "qr",
      signature: "mock_signature_abc123"
    };

    const response = await request(app)
        .post('/api/v1/payments/webhooks/momo') // SỬA ĐÚNG DÒNG NÀY (Đảo ngược webhooks/momo)
      .send(webhookPayload)

    // Xử lý Webhook thường trả về 200 OK hoặc 204 No Content cho MoMo
    expect([200, 204]).toContain(response.status); 
  });
});