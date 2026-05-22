const genAI = require('../config/gemini');
const AppError = require('../utils/appError');

const generationConfig = {
  responseMimeType: 'application/json',
};

// --- [API 1] Đọc trực tiếp từ Buffer PDF ---
const extractVocabFromPdf = async (fileBuffer) => {
  try {
    // 🚀 ĐÃ SỬA: Nâng cấp lên gemini-2.5-flash
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig });
    
    const prompt = `Bạn là chuyên gia ngôn ngữ. Hãy trích xuất từ vựng tiếng Anh có giá trị học thuật từ file PDF đính kèm. BỎ QUA các từ thông dụng như: the, a, is, are, and, or, in, on, at.
Trả về ĐÚNG định dạng JSON là một mảng các object chứa: word, meaning, pronunciation, example_sentence, part_of_speech.
TUYỆT ĐỐI KHÔNG SỬ DỤNG MARKDOWN. CHỈ TRẢ VỀ JSON.`;

    const filePart = {
      inlineData: {
        data: fileBuffer.toString("base64"),
        mimeType: "application/pdf"
      }
    };

    const result = await model.generateContent([prompt, filePart]);
    const rawText = result.response.text();

    const cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(cleanText);
  } catch (error) {
    console.error('🔥 Lỗi Gemini API (PDF Native):', error.message);
    throw new AppError(500, 'Lỗi khi gọi AI trích xuất từ vựng. Vui lòng thử lại sau.', 'GEMINI_API_ERROR');
  }
};

// --- [API 2 & 3] Hàm sinh câu hỏi trắc nghiệm ---
const generateQuestions = async (flashcards, numQuestions) => {
  try {
    // 🚀 ĐÃ SỬA: Nâng cấp lên gemini-2.5-flash
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', generationConfig });
    
    const vocabList = flashcards.map(f => ({ id: f.id, word: f.word, meaning: f.meaning }));

    const prompt = `Bạn là giáo viên tiếng Anh. Dựa vào danh sách từ vựng sau, hãy sinh ra ĐÚNG ${numQuestions} câu hỏi trắc nghiệm.
    Từ vựng: ${JSON.stringify(vocabList)}
    
    Quy tắc:
    1. Trộn lẫn 3 loại câu hỏi (question_type): WORD_TO_MEANING (Hỏi nghĩa của từ), MEANING_TO_WORD (Hỏi từ dựa trên nghĩa), FILL_IN_BLANK (Điền từ vào chỗ trống trong câu ví dụ).
    2. Mỗi câu phải có 4 đáp án (options), trong đó chỉ có 1 đáp án đúng (is_correct: true).
    3. Trả về ĐÚNG định dạng MẢNG JSON các object chứa: flashcard_id, question_type, content, options (mảng 4 object: content, is_correct), explanation.
    TUYỆT ĐỐI KHÔNG DÙNG MARKDOWN. CHỈ TRẢ VỀ JSON ARRAY THUẦN.`;

    const result = await model.generateContent(prompt);
    const rawText = result.response.text();

    const cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(cleanText);
  } catch (error) {
    console.error('🔥 Lỗi Gemini API (Questions):', error.message);
    throw new AppError(500, 'AI đang quá tải, không thể sinh câu hỏi lúc này.', 'GEMINI_API_ERROR');
  }
};

module.exports = {
  extractVocabFromPdf,
  generateQuestions
};