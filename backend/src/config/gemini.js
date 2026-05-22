const { GoogleGenerativeAI } = require('@google/generative-ai');

// Khởi tạo Gemini bằng API Key lấy từ file .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

module.exports = genAI;