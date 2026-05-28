const genAI = require("../config/gemini");
const AppError = require("../utils/appError");

const generationConfig = {
  responseMimeType: "application/json",
};

// Hàm làm sạch JSON từ response có thể bị nhiễm markdown hoặc text thừa
const cleanJsonResponse = (text) => {
  // Loại bỏ markdown code blocks
  let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  // Tìm phần JSON đầu tiên (từ { hoặc [ đến } hoặc ] cuối cùng)
  const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (match) {
    return match[0];
  }
  return cleaned;
};

const extractVocabFromPdf = async (fileBuffer) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig,
    });
    const prompt = `Bạn là chuyên gia ngôn ngữ. Hãy trích xuất TỐI ĐA 50 từ vựng tiếng Anh có giá trị học thuật từ file PDF đính kèm. BỎ QUA các từ thông dụng như: the, a, is, are, and, or, in, on, at.
Trả về ĐÚNG định dạng JSON là một mảng các object chứa: word, meaning, pronunciation, example_sentence, part_of_speech.
TUYỆT ĐỐI KHÔNG SỬ DỤNG MARKDOWN. CHỈ TRẢ VỀ JSON.`;
    const filePart = {
      inlineData: {
        data: fileBuffer.toString("base64"),
        mimeType: "application/pdf",
      },
    };
    const result = await model.generateContent([prompt, filePart]);
    const rawText = result.response.text();
    const cleanText = cleanJsonResponse(rawText);
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("🔥 Lỗi Gemini API (PDF):", error.message);
    if (error.message.includes("429") || error.message.includes("quota")) {
      throw new AppError(
        429,
        "Bạn đã hết lượt sử dụng AI hôm nay. Vui lòng thử lại sau 24 giờ hoặc nâng cấp Premium để tăng giới hạn.",
        "AI_QUOTA_EXCEEDED",
      );
    }
    throw new AppError(
      500,
      "Lỗi khi gọi AI trích xuất từ vựng. Vui lòng thử lại sau.",
      "GEMINI_API_ERROR",
    );
  }
};

const generateQuestions = async (flashcards, numQuestions) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig,
    });
    const vocabList = flashcards.map((f) => ({
      id: f.id,
      word: f.word,
      meaning: f.meaning,
    }));
    const prompt = `Bạn là giáo viên tiếng Anh. Dựa vào danh sách từ vựng sau, hãy sinh ra ĐÚNG ${numQuestions} câu hỏi trắc nghiệm.
Từ vựng: ${JSON.stringify(vocabList)}
Quy tắc: Trộn lẫn 3 loại câu hỏi (WORD_TO_MEANING, MEANING_TO_WORD, FILL_IN_BLANK). Mỗi câu có 4 đáp án, 1 đáp án đúng. Trả về MẢNG JSON các object chứa: flashcard_id, question_type, content, options (mảng 4 object: content, is_correct), explanation.
TUYỆT ĐỐI KHÔNG DÙNG MARKDOWN. CHỈ TRẢ VỀ JSON ARRAY THUẦN.`;
    const result = await model.generateContent(prompt);
    const rawText = result.response.text();
    const cleanText = cleanJsonResponse(rawText);
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("🔥 Lỗi Gemini API (Questions):", error.message);
    if (error.message.includes("429") || error.message.includes("quota")) {
      throw new AppError(
        429,
        "Bạn đã hết lượt sử dụng AI hôm nay. Vui lòng thử lại sau 24 giờ hoặc nâng cấp Premium để tăng giới hạn.",
        "AI_QUOTA_EXCEEDED",
      );
    }
    throw new AppError(
      500,
      "AI không sinh được câu hỏi. Vui lòng thử lại.",
      "GEMINI_API_ERROR",
    );
  }
};

module.exports = { extractVocabFromPdf, generateQuestions };