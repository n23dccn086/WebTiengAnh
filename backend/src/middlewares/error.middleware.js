// File: src/middlewares/error.middleware.js

const errorMiddleware = (err, req, res, next) => {
  // 1. Log lỗi ra console để dev dễ fix bug
  console.error('🔥 [ERROR LOG]:', err.message);

  // 2. Set giá trị mặc định nếu không xác định được lỗi
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Lỗi hệ thống máy chủ nội bộ.';
  let errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';

  // ----------------------------------------------------
  // 3. AUTO CATCH: TỰ ĐỘNG BẮT CÁC LỖI TỪ THƯ VIỆN BÊN THỨ 3
  // ----------------------------------------------------

  // Lỗi Database MySQL (Ví dụ: Đăng ký trùng Email có cờ UNIQUE)
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409; // Conflict
    message = 'Dữ liệu này đã tồn tại trong hệ thống (Email hoặc thông tin bị trùng).';
    errorCode = 'DB_DUPLICATE_ENTRY';
  }

  // Lỗi JWT Token (Khi user gửi Token chế hoặc Token hỏng)
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401; // Unauthorized
    message = 'Chữ ký xác thực không hợp lệ. Vui lòng đăng nhập lại.';
    errorCode = 'AUTH_INVALID_TOKEN';
  }

  // Lỗi JWT Token hết hạn
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Phiên đăng nhập của bạn đã hết hạn. Vui lòng đăng nhập lại.';
    errorCode = 'AUTH_TOKEN_EXPIRED';
  }

  // Lỗi Validation từ thư viện Joi (Dữ liệu đầu vào sai format)
  if (err.isJoi) {
    statusCode = 400; // Bad Request
    // Gom tất cả các lỗi của Joi thành 1 chuỗi string dễ đọc
    message = err.details.map(detail => detail.message).join(', '); 
    errorCode = 'VALIDATION_ERROR';
  }

  // ----------------------------------------------------
  // 4. TRẢ VỀ ĐỊNH DẠNG JSON CHUẨN CHO FRONTEND
  // ----------------------------------------------------
  res.status(statusCode).json({
    status: 'error',
    message: message,
    error_code: errorCode,
    // (Tùy chọn): Chỉ in ra Stack Trace chi tiết khi chạy localhost (development)
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorMiddleware;