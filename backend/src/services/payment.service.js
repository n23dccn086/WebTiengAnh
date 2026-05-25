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
const handleMoMoWebhook = async (req, res) => {
  console.log("\n🚀🚀🚀 [WEBHOOK] MOMO ĐÃ GÕ CỬA APPS CỦA BẠN!!!");
  
  // Lấy dữ liệu từ body do Express parse
  const ipnData = req.body;
  console.log("📦 Cục dữ liệu MoMo gửi tới Body:", ipnData);

  if (!ipnData || !ipnData.orderId) {
    console.error("❌ [LỖI GIẢI MÃ] Không tìm thấy dữ liệu Body. Kiểm tra xem app đã cài app.use(express.json()) chưa.");
    return res.status(400).json({ message: "Bad Request: No Body Data" });
  }

  const {
    partnerCode, orderId, requestId, amount, orderInfo, orderType,
    transId, resultCode, message, payType, responseTime, extraData, signature
  } = ipnData;

  // 1. Xác thực chữ ký để đảm bảo request này thật sự do MoMo gửi tới
  const rawSignature = `accessKey=${momoConfig.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
  const mySignature = createSignature(rawSignature);

  if (mySignature !== signature) {
    console.error('❌ CẢNH BÁO: Chữ ký MoMo Webhook không hợp lệ!');
    console.log("-> Chữ ký của MoMo:", signature);
    console.log("-> Chữ ký hệ thống tự tính:", mySignature);
    return res.status(400).json({ message: "Invalid Signature" }); 
  }

  console.log("✅ Chữ ký hợp lệ! Khớp 100%. Đang truy vấn Database cho mã đơn:", orderId);
  
  try {
    const transaction = await TransactionModel.getTransactionByOrderId(orderId);
    
    if (!transaction) {
      console.error("❌ [LỖI DATABASE] Không tìm thấy mã đơn này trong bảng transactions!");
      return res.status(200).json({ message: "Transaction not found but acknowledged" });
    }
    
    if (transaction.status !== 'PENDING') {
      console.log("⚠️ Đơn hàng này đã được xử lý trước đó rồi. Trạng thái hiện tại:", transaction.status);
      return res.status(200).json({ message: "Already processed" }); 
    }

    console.log("✅ Đơn hàng hợp lệ (PENDING). Tiến hành mở Transaction MySQL để nâng cấp Premium...");
    
    // Sử dụng cấu hình bọc Promise từ file database.js của bạn
    const rawConnection = await db.getConnection(); 
    const connection = rawConnection.promise(); 

    await connection.beginTransaction();

    try {
      if (Number(resultCode) === 0) {
        // Giao dịch thành công
        await TransactionModel.updateTransactionStatus(connection, orderId, 'SUCCESS');
        await TransactionModel.upgradeUserToPremium(connection, transaction.user_id);
        console.log(`🎉 [THÀNH CÔNG RỰC RỠ] Đã nâng cấp Premium thành công cho User ID: ${transaction.user_id}`);
      } else {
        // Giao dịch thất bại
        await TransactionModel.updateTransactionStatus(connection, orderId, 'FAILED');
        console.log(`❌ Giao dịch thất bại từ phía khách hàng (Mã lỗi MoMo: ${resultCode})`);
      }

      await connection.commit();
      rawConnection.release();
      
      // BẮT BUỘC: Phải trả về trạng thái 204 hoặc 200 cho MoMo biết là bạn đã nhận hàng
      return res.status(204).send();
    } catch (error) {
      await connection.rollback();
      rawConnection.release();
      console.error('🔥 Lỗi khi đang thực thi ghi dữ liệu SQL (Rollback kích hoạt):', error);
      return res.status(500).json({ error: "Database transaction execution error" });
    }

  } catch (error) {
    console.error('🔥 Lỗi nghẽn kết nối đầu vào Database:', error);
    return res.status(500).json({ error: "Database connection error" });
  }
};

module.exports = {
  createMoMoPayment,
  handleMoMoWebhook,
};