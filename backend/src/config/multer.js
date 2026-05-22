const multer = require('multer');
const AppError = require('../utils/appError');

// Lưu tạm file vào RAM để dễ dàng ném cho pdf-parse đọc
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new AppError(400, 'Chỉ hỗ trợ định dạng file PDF.', 'INVALID_FILE_TYPE'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Giới hạn kích thước file max 10MB để chống spam sập server
  },
  fileFilter: fileFilter,
});

module.exports = upload;