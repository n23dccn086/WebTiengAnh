const multer = require('multer');
const AppError = require('../utils/appError');

// Lưu file vào RAM
const storage = multer.memoryStorage();

// Filter cho PDF
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new AppError(400, 'Chỉ hỗ trợ định dạng file PDF.', 'INVALID_FILE_TYPE'), false);
  }
};

// Filter cho Excel/CSV
const excelFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'application/csv',
    'text/plain'
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(400, 'Chỉ hỗ trợ file Excel (.xlsx, .xls) hoặc CSV', 'INVALID_FILE_TYPE'), false);
  }
};

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter });
const uploadExcel = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: excelFilter });

module.exports = { upload, uploadExcel };