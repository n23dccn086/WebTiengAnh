// File: src/middlewares/validate.middleware.js
const AppError = require('../utils/appError');

const validate = (schema) => {
  return (req, res, next) => {
    // abortEarly: false giúp Joi quét hết tất cả các lỗi (ví dụ sai cả email lẫn pass) thay vì dừng ở lỗi đầu tiên
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      // Gom tất cả câu thông báo lỗi thành 1 chuỗi cách nhau bằng dấu phẩy
      const errorMessage = error.details.map((detail) => detail.message).join(', ');
      
      // Quăng lỗi ra cho Trạm thu gom rác (error.middleware) xử lý
      return next(new AppError(400, errorMessage, 'VALIDATION_ERROR'));
    }

    // Nếu hợp lệ thì cho đi tiếp vào Controller
    next();
  };
};

module.exports = validate;