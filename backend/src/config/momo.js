const crypto = require('crypto');

// BỘ KEY TEST CHUẨN TỪ GITHUB CỦA MOMO DEVELOPERS
const momoConfig = {
  partnerCode: 'MOMOBKUN20180529',
  accessKey: 'klm05TvNBzhg7h7j', // Đã sửa lại đúng key
  secretKey: 'at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa', // Đã sửa lại đúng key
  
  apiUrl: 'https://test-payment.momo.vn/v2/gateway/api/create',
  redirectUrl: 'http://localhost:5173/payment/result',
  ipnUrl: 'https://staff-herald-granite.ngrok-free.dev/api/v1/payments/webhooks/momo' 
};

// Hàm tạo chữ ký bảo mật HMAC SHA256
const createSignature = (rawSignature) => {
  return crypto
    .createHmac('sha256', momoConfig.secretKey)
    .update(rawSignature)
    .digest('hex');
};

module.exports = {
  momoConfig,
  createSignature,
};