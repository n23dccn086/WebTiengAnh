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

// --- [API 7] Chat với AI Tutor ---
const chatTutor = async (userMessage, chatHistory = [], currentQuestion = null) => {
  try {
    // Lưu ý: Chat Tutor trả về Text thường (Markdown), KHÔNG ép responseMimeType là JSON
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // 1. XÂY DỰNG "VÒNG KIM CÔ" CHO AI (SYSTEM PROMPT)
    let systemPrompt = `Bạn là NeuralLearn AI - một gia sư tiếng Anh tận tâm, thân thiện và chuyên nghiệp.
    QUY TẮC TỐI THƯỢNG (BẮT BUỘC TUÂN THỦ):
    1. CHỈ TRẢ LỜI các vấn đề liên quan đến việc học tiếng Anh (ngữ pháp, từ vựng, dịch thuật, phát âm, IELTS/TOEIC).
    2. TỪ CHỐI MỌI YÊU CẦU ngoài lề như: Giải toán, viết code lập trình, lịch sử, chính trị, viết văn bản không liên quan đến học ngoại ngữ.
    3. Nếu user hỏi ngoài lề, hãy trả lời lịch sự: "Xin lỗi, mình là gia sư tiếng Anh của NeuralLearn nên chỉ có thể hỗ trợ bạn các vấn đề về ngôn ngữ thôi nhé. Bạn cần hỏi gì về từ vựng hay ngữ pháp nào?".
    4. Trình bày ngắn gọn, dễ hiểu. Sử dụng in đậm (**từ khóa**) hoặc in nghiêng để làm nổi bật.`;

    // 2. BƠM NGỮ CẢNH BÀI TẬP HIỆN TẠI VÀO NÃO AI (Để AI biết user đang làm câu nào)
    if (currentQuestion) {
      systemPrompt += `\n\nNGỮ CẢNH HIỆN TẠI (Học viên đang làm câu hỏi này):
      - Câu hỏi: ${currentQuestion.content}
      - Các đáp án: ${currentQuestion.options?.map(o => o.content).join(' | ') || 'Chưa rõ'}
      - Giải thích từ hệ thống: ${currentQuestion.explanation || 'Không có'}`;
    }

    // 3. CHUYỂN ĐỔI LỊCH SỬ CHAT SANG CHUẨN GEMINI
    // Frontend gửi lên: { role: 'user'/'ai', content: '...' }
    // Gemini nhận vào: { role: 'user'/'model', parts: [{ text: '...' }] }
    const formattedHistory = chatHistory.map(msg => ({
      role: msg.role === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.content || '' }]
    }));

    // 4. BẮT ĐẦU PHIÊN CHAT
    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "Đã rõ! Tôi sẽ tuân thủ tuyệt đối quy tắc chỉ dạy tiếng Anh và từ chối mọi câu hỏi ngoài lề." }] },
        ...formattedHistory
      ],
    });

    // 5. GỬI TIN NHẮN CỦA USER VÀ LẤY PHẢN HỒI
    const result = await chat.sendMessage(userMessage);
    return result.response.text();

  } catch (error) {
    console.error('🔥 Lỗi Gemini API (Chat Tutor):', error.message);
    throw new AppError(500, 'AI Tutor hiện đang quá tải. Bạn hãy thử lại sau ít phút nhé.', 'GEMINI_API_ERROR');
  }
};

module.exports = {
  extractVocabFromPdf,
  generateQuestions,
  chatTutor
};