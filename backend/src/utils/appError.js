// File: src/utils/appError.js

class AppError extends Error {
  constructor(statusCode, message, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true; // Đánh dấu đây là lỗi do mình chủ động bắt, không phải lỗi sập app (bug)
    
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;