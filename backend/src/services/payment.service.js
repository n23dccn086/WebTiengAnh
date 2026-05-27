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
// API 2: XỬ LÝ IPN/WEBHOOK TỪ MOMO GỬI VỀ (BẢN RADAR DÒ BUG CHUẨN HOSTING)
const handleMoMoWebhook = async (ipnData) => {
  console.log("\n🚀 [WEBHOOK] Nhận data từ MoMo:", JSON.stringify(ipnData, null, 2));

  const { orderId, resultCode, amount, transId } = ipnData;
  if (!orderId) {
    console.error("❌ Thiếu orderId trong webhook");
    return false;
  }

  const transaction = await TransactionModel.getTransactionByOrderId(orderId);
  if (!transaction) {
    console.error("❌ Không tìm thấy transaction:", orderId);
    return false;
  }

  if (transaction.status !== 'PENDING') {
    console.log(`⚠️ Transaction ${orderId} đã xử lý, status: ${transaction.status}`);
    return true;
  }

  if (Number(resultCode) !== 0) {
    console.log(`❌ Giao dịch thất bại, resultCode: ${resultCode}`);
    await TransactionModel.updateTransactionStatus(null, orderId, 'FAILED');
    return true;
  }

  // Giao dịch thành công
  const connection = await db.getConnection();
  try {
    await new Promise((resolve, reject) => {
      connection.beginTransaction(err => err ? reject(err) : resolve());
    });

    await TransactionModel.updateTransactionStatus(connection, orderId, 'SUCCESS');
    await TransactionModel.upgradeUserToPremium(connection, transaction.user_id);

    await new Promise((resolve, reject) => {
      connection.commit(err => err ? reject(err) : resolve());
    });

    console.log(`🎉 Nâng cấp Premium thành công cho user ID: ${transaction.user_id}`);
    return true;
  } catch (error) {
    await new Promise((resolve) => connection.rollback(() => resolve()));
    console.error('🔥 Lỗi khi nâng cấp Premium:', error);
    return false;
  } finally {
    connection.release();
  }
};

// service - thêm vào payment.service.js
const verifyMomoPayment = async (orderId, resultCode) => {
  const transaction = await TransactionModel.getTransactionByOrderId(orderId);

  if (!transaction) throw new AppError(404, 'Không tìm thấy đơn hàng', 'NOT_FOUND');
  if (transaction.status === 'SUCCESS') {
    return { alreadyUpgraded: true };
  }

  const rawConnection = await db.getConnection();
  const exec = (sql, params) => new Promise((resolve, reject) => {
    rawConnection.execute(sql, params, (err, results) => {
      if (err) reject(err); else resolve(results);
    });
  });
  const beginTx = () => new Promise((res, rej) => rawConnection.beginTransaction(err => err ? rej(err) : res()));
  const commitTx = () => new Promise((res, rej) => rawConnection.commit(err => err ? rej(err) : res()));
  const rollbackTx = () => new Promise(res => rawConnection.rollback(() => res()));

  await beginTx();
  try {
    if (Number(resultCode) === 0) {
      await TransactionModel.updateTransactionStatus(rawConnection, orderId, 'SUCCESS');
      await TransactionModel.upgradeUserToPremium(rawConnection, transaction.user_id);
      console.log(`🎉 Nâng cấp Premium cho user: ${transaction.user_id}`);
    } else {
      await TransactionModel.updateTransactionStatus(rawConnection, orderId, 'FAILED');
    }
    await commitTx();
    rawConnection.release();
    return { upgraded: Number(resultCode) === 0 };
  } catch (err) {
    await rollbackTx();
    rawConnection.release();
    throw err;
  }
};

module.exports = {
  createMoMoPayment,
  handleMoMoWebhook,
  verifyMomoPayment
};