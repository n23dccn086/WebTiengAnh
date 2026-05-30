// backend/src/services/gemini.service.js
const genAI = require("../config/gemini");
const AppError = require("../utils/appError");
const { HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');

// 🟢 IMPORT THƯ VIỆN GROQ LÊN ĐẦU FILE CHO CHUẨN
const Groq = require("groq-sdk"); 

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

const generationConfig = {
  responseMimeType: "application/json",
};

const cleanJsonResponse = (text) => {
  if (!text) return "[]";
  let cleaned = text.trim();
  cleaned = cleaned.replace(/```json/gi, '').replace(/```/g, '').trim();
  const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  return match ? match[0] : cleaned;
};

// 1. HÀM TRÍCH XUẤT PDF
const extractVocabFromPdf = async (fileBuffer) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash", // ✅ Đã trả về 2.5 cho bạn
      generationConfig,
      safetySettings
    });
    
    const prompt = `Bạn là chuyên gia ngôn ngữ. Hãy trích xuất TỐI ĐA 50 từ vựng tiếng Anh có giá trị học thuật từ file PDF đính kèm. BỎ QUA các từ thông dụng như: the, a, is, are, and, or, in, on, at.
Trả về MẢNG JSON thuần chứa các object có key: word, meaning, pronunciation, example_sentence, part_of_speech.`;
    
    const filePart = { inlineData: { data: fileBuffer.toString("base64"), mimeType: "application/pdf" } };
    const result = await model.generateContent([prompt, filePart]);
    const cleanText = cleanJsonResponse(result.response.text());

    return JSON.parse(cleanText);
  } catch (error) {
    console.error("🔥 Lỗi Gemini API (PDF):", error.message);
    if (error.message.includes("429") || error.message.includes("quota")) {
      throw new AppError(429, "Bạn đã hết lượt sử dụng AI hôm nay. Vui lòng thử lại sau.", "AI_QUOTA_EXCEEDED");
    }
    throw new AppError(500, "Lỗi khi gọi AI trích xuất từ vựng. Vui lòng thử lại sau.", "GEMINI_API_ERROR");
  }
};

// 2. HÀM TẠO CÂU HỎI
const generateQuestions = async (flashcards, numQuestions) => {
  const vocabList = flashcards.map((f) => ({ id: f.id, word: f.word, meaning: f.meaning }));
  const prompt = `Bạn là giáo viên tiếng Anh. Dựa vào danh sách từ vựng sau, hãy sinh ra ĐÚNG ${numQuestions} câu hỏi trắc nghiệm.
Từ vựng: ${JSON.stringify(vocabList)}
Quy tắc: Trộn lẫn 3 loại câu hỏi (WORD_TO_MEANING, MEANING_TO_WORD, FILL_IN_BLANK). Mỗi câu có 4 đáp án, 1 đáp án đúng. Trả về MẢNG JSON các object chứa: flashcard_id, question_type, content, options (mảng 4 object: content, is_correct(boolean)), explanation. KHÔNG DÙNG MARKDOWN, CHỈ TRẢ VỀ MẢNG JSON.`;

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", // ✅ Đã trả về 2.5 cho bạn
      generationConfig, 
      safetySettings 
    });
    const result = await model.generateContent(prompt);
    return JSON.parse(cleanJsonResponse(result.response.text()));
  } catch (geminiError) {
    console.warn("⚠️ [GEMINI LỖI TẠO CÂU HỎI]: Đang chuyển sang GROQ API...", geminiError.message);
    try {
      if (!process.env.GROQ_API_KEY) throw new Error("Thiếu GROQ_API_KEY trong file .env");
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
        temperature: 0.2,
      });
      return JSON.parse(cleanJsonResponse(chatCompletion.choices[0]?.message?.content));
    } catch (groqError) {
      console.error("❌ [LỖI NGHIÊM TRỌNG] Cả Gemini và Groq đều thất bại (Questions):", groqError.message);
      throw new AppError(500, "Hệ thống AI đang quá tải, không thể sinh câu hỏi. Vui lòng thử lại.", "AI_ALL_FAILED");
    }
  }
};

// 3. HÀM CHAT TUTOR
const chatTutor = async (userMessage, chatHistory = [], currentQuestion = null) => {
  let systemPrompt = `Bạn là NeuralLearn AI - một gia sư tiếng Anh tận tâm. 
QUY TẮC: CHỈ TRẢ LỜI các vấn đề tiếng Anh (ngữ pháp, từ vựng...). TỪ CHỐI mọi yêu cầu ngoài lề lịch sự. Trình bày ngắn gọn.`;

  if (currentQuestion) {
    systemPrompt += `\nNGỮ CẢNH: Đang làm câu hỏi: ${currentQuestion.content} | Đáp án: ${currentQuestion.options?.map(o => o.content).join(', ') || '...'} | Giải thích: ${currentQuestion.explanation || 'Không'}`;
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash', // ✅ Đã trả về 2.5 cho bạn
      safetySettings 
    });
    const formattedHistory = chatHistory.map(msg => ({
      role: msg.role === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.content || '' }]
    }));
    const chat = model.startChat({
      history: [ { role: "user", parts: [{ text: systemPrompt }] }, { role: "model", parts: [{ text: "Đã rõ!" }] }, ...formattedHistory ],
    });
    const result = await chat.sendMessage(userMessage);
    return result.response.text();
  } catch (geminiError) {
    console.warn("⚠️ [GEMINI LỖI CHAT TUTOR]: Đang chuyển sang GROQ API...", geminiError.message);
    try {
      if (!process.env.GROQ_API_KEY) throw new Error("Thiếu GROQ_API_KEY trong file .env");
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const groqMessages = [
        { role: "system", content: systemPrompt },
        ...chatHistory.map(msg => ({ role: msg.role === 'ai' ? 'assistant' : 'user', content: msg.content })),
        { role: "user", content: userMessage }
      ];
      const chatCompletion = await groq.chat.completions.create({
        messages: groqMessages,
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
      });
      return chatCompletion.choices[0]?.message?.content;
    } catch (groqError) {
      console.error("❌ [LỖI NGHIÊM TRỌNG] Cả Gemini và Groq đều thất bại (Chat):", groqError.message);
      throw new AppError(500, "AI Tutor hiện đang quá tải. Bạn hãy thử lại sau ít phút nhé.", "AI_ALL_FAILED");
    }
  }
};

module.exports = {
  extractVocabFromPdf,
  generateQuestions,
  chatTutor
};