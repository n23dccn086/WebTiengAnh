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
  console.log("\n🚀 [WEBHOOK] Nhận data từ MoMo:");
  console.log(JSON.stringify(ipnData, null, 2));

  // THÊM: Log signature để so sánh
  const { partnerCode, orderId, requestId, amount, orderInfo, orderType,
    transId, resultCode, message, payType, responseTime, extraData, signature } = ipnData;

  const rawSignature = `accessKey=${momoConfig.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
  const mySignature = createSignature(rawSignature);

  console.log("→ MoMo signature  :", signature);
  console.log("→ System signature :", mySignature);
  console.log("→ accessKey đang dùng:", momoConfig.accessKey); // THÊM DÒNG NÀY
  console.log("→ secretKey đang dùng:", momoConfig.secretKey); // THÊM DÒNG NÀY

  if (mySignature !== signature) {
    console.error('❌ Chữ ký KHÔNG khớp!');
    console.error('❌ CẢNH BÁO: Chữ ký MoMo Webhook không hợp lệ!');
    console.log("-> Chữ ký của MoMo:", signature);
    console.log("-> Chữ ký hệ thống tính:", mySignature);
    return false;
  }

  console.log("✅ Chữ ký hợp lệ! Đang truy vấn Database cho mã đơn:", orderId);
  
  try {
    const transaction = await TransactionModel.getTransactionByOrderId(orderId);
    
    if (!transaction) {
      console.error("❌ [LỖI DATABASE] Không tìm thấy mã đơn này trong bảng transactions!");
      return true; // Return true để Controller trả 200 cho MoMo, tránh bị gọi lại
    }
    
    if (transaction.status !== 'PENDING') {
      console.log("⚠️ Đơn hàng này đã xử lý trước đó. Trạng thái:", transaction.status);
      return true; 
    }

    console.log("✅ Đơn hàng PENDING. Tiến hành mở Transaction MySQL cập nhật Premium...");
    
    const rawConnection = await db.getConnection(); 
    
    // 🔥 FIX LỖI PROMISE (Nếu dùng db pool tự custom)
    // Thay vì rawConnection.promise(), ta tạo một helper để xài Promise cho connection
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
        // Giao dịch thành công
        // Lưu ý: Đảm bảo TransactionModel hỗ trợ truyền connection raw vào
        await TransactionModel.updateTransactionStatus(rawConnection, orderId, 'SUCCESS');
        await TransactionModel.upgradeUserToPremium(rawConnection, transaction.user_id);
        console.log(`🎉 [THÀNH CÔNG RỰC RỠ] Đã nâng cấp Premium thành công cho User ID: ${transaction.user_id}`);
      } else {
        // Giao dịch thất bại
        await TransactionModel.updateTransactionStatus(rawConnection, orderId, 'FAILED');
        console.log(`❌ Giao dịch thất bại từ phía khách hàng (Mã lỗi: ${resultCode})`);
      }

      await commitTx();
      rawConnection.release();
      return true; // Xử lý thành công toàn bộ
    } catch (error) {
      await rollbackTx();
      rawConnection.release();
      console.error('🔥 Lỗi khi đang thực thi ghi dữ liệu SQL (Rollback):', error);
      return false;
    }

  } catch (error) {
    console.error('🔥 Lỗi truy vấn Database hoặc mất kết nối:', error);
    return false;
  }
};

module.exports = {
  createMoMoPayment,
  handleMoMoWebhook,
};