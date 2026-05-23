const axios = require('axios');
const { momoConfig, createSignature } = require('../config/momo');
const TransactionModel = require('../models/transaction.model');
const db = require('../config/database');
const AppError = require('../utils/appError');

// API 1: TẠO URL THANH TOÁN MOMO
 // requestType: 'captureWallet',
const createMoMoPayment = async (userId) => {
  const orderId = `EDTECH_${Date.now()}_${userId}`;
  const amount = 50000;
  const orderInfo = 'Nang cap tai khoan Premium 1 Thang';
  const requestId = orderId;
  const extraData = '';
  
  // Đưa requestType ra thành biến dùng chung để tránh vụ nhầm lẫn đau thương này
  const requestType = 'payWithATM'; 

  // Truyền biến ${requestType} vào chuỗi chữ ký
  const rawSignature = `accessKey=${momoConfig.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${momoConfig.ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${momoConfig.partnerCode}&redirectUrl=${momoConfig.redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
  
  const signature = createSignature(rawSignature);

  const requestBody = {
    partnerCode: momoConfig.partnerCode,
    partnerName: 'English Flashcard AI',
    storeId: 'MomoTestStore',
    requestId: requestId,
    amount: amount,
    orderId: orderId,
    orderInfo: orderInfo,
    redirectUrl: momoConfig.redirectUrl,
    ipnUrl: momoConfig.ipnUrl,
    lang: 'vi',
    requestType: requestType, // Truyền biến vào body
    autoCapture: true,
    extraData: extraData,
    signature: signature,
  };

  try {
    // 1. Gửi request sang MoMo để tạo Link quét QR
    const response = await axios.post(momoConfig.apiUrl, requestBody);
    
    // 2. Lưu xuống Database trạng thái PENDING
    await TransactionModel.createTransaction(userId, orderId, amount, 'PENDING');

    return {
      payUrl: response.data.payUrl, // Link này Frontend mở lên để user quét mã
      transaction_ref: orderId
    };
  } catch (error) {
    console.error('🔥 LỖI THỰC SỰ TỪ MOMO:', error.response ? error.response.data : error.message);
    throw new AppError(500, 'Không thể tạo giao dịch MoMo lúc này.', 'MOMO_PAYMENT_ERROR');
  }
};

// API 2: XỬ LÝ IPN/WEBHOOK TỪ MOMO GỬI VỀ
// API 2: XỬ LÝ IPN/WEBHOOK TỪ MOMO GỬI VỀ
const handleMoMoWebhook = async (ipnData) => {
  const {
    partnerCode, orderId, requestId, amount, orderInfo, orderType,
    transId, resultCode, message, payType, responseTime, extraData, signature
  } = ipnData;

  // 1. Xác thực chữ ký để đảm bảo request này thật sự do MoMo gửi tới
  const rawSignature = `accessKey=${momoConfig.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
  const mySignature = createSignature(rawSignature);

  if (mySignature !== signature) {
    console.error('❌ CẢNH BÁO: Chữ ký MoMo Webhook không hợp lệ!');
    return false; // Phớt lờ request giả mạo
  }

  // 2. Kiểm tra xem giao dịch có tồn tại trong DB không
  const transaction = await TransactionModel.getTransactionByOrderId(orderId);
  if (!transaction || transaction.status !== 'PENDING') {
    return true; // Báo thành công để MoMo không gọi lại nữa (Dù giao dịch có thể đã xử lý rồi)
  }

  // 3. Xử lý logic Database (BẮT BUỘC DÙNG TRANSACTION THEO ĐÚNG SPEC)
  
  // 🔥 CHỖ NÀY LÀ CÁI BẠN CẦN SỬA ĐỂ FIX LỖI MYSQL PROMISE NÈ 🔥
  const rawConnection = await db.getConnection(); 
  const connection = rawConnection.promise(); // <--- Phép thuật biến thành Promise

  await connection.beginTransaction();

  try {
    if (resultCode === 0) {
      // Giao dịch thành công
      await TransactionModel.updateTransactionStatus(connection, orderId, 'SUCCESS');
      await TransactionModel.upgradeUserToPremium(connection, transaction.user_id);
      console.log(`✅ Nâng cấp Premium thành công cho User ID: ${transaction.user_id}`);
    } else {
      // Giao dịch thất bại (Hủy, lỗi thẻ, v.v)
      await TransactionModel.updateTransactionStatus(connection, orderId, 'FAILED');
      console.log(`❌ Giao dịch thất bại (Mã lỗi ${resultCode}): ${orderId}`);
    }

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    console.error('🔥 Lỗi Database khi xử lý Webhook MoMo:', error);
    return false;
  } finally {
    rawConnection.release(); // Nhớ đổi thành rawConnection ở đây nhé
  }
};

module.exports = {
  createMoMoPayment,
  handleMoMoWebhook,
};