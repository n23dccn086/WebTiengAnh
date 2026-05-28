// backend/src/utils/pdfExtract.js
const { PDFDocument } = require('pdf-lib');
const AppError = require('./appError');

const extractTextFromPDF = async (dataBuffer) => {
  try {
    const pdfDoc = await PDFDocument.load(dataBuffer);
    const numPages = pdfDoc.getPageCount();
    return { numPages };
  } catch (error) {
    console.error("🔥 [LỖI ĐỌC PDF]:", error.message);
    // Không throw lỗi kỹ thuật mà dùng AppError
    throw new AppError(400, 'Không thể đọc file PDF. Hãy đảm bảo file đúng định dạng PDF và không bị hỏng.', 'PDF_READ_ERROR');
  }
};

module.exports = extractTextFromPDF;