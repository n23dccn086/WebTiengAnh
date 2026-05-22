const { PDFDocument } = require('pdf-lib');
const AppError = require('./appError');

const extractTextFromPDF = async (dataBuffer) => {
  try {
    // Dùng pdf-lib cực kỳ xịn và ổn định chỉ để đếm số trang
    const pdfDoc = await PDFDocument.load(dataBuffer);
    const numPages = pdfDoc.getPageCount();
    
    return { numPages }; // Không cần trích xuất text nữa
  } catch (error) {
    console.error("🔥 [LỖI ĐỌC PDF]:", error);
    throw new AppError(500, 'Không thể đọc file PDF này. File có thể bị hỏng.', 'PDF_PARSE_ERROR');
  }
};

module.exports = extractTextFromPDF;