const crypto = require('crypto');
require('dotenv').config(); // Khai báo dòng này để đảm bảo Node.js đọc được file .env

// BỘ KEY TEST CHUẨN ĐỌC TỪ FILE .ENV (DÙNG CHUNG CHO CẢ TEAM)
const momoConfig = {
  partnerCode: process.env.MOMO_PARTNER_CODE,
  accessKey: process.env.MOMO_ACCESS_KEY,
  secretKey: process.env.MOMO_SECRET_KEY,
  
  apiUrl: process.env.MOMO_API_URL,
  redirectUrl: process.env.MOMO_REDIRECT_URL,
  ipnUrl: process.env.MOMO_IPN_URL 
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