const Groq = require('groq-sdk');

// Khởi tạo client với API key từ biến môi trường
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Hàm chat thông thường (dùng cho AI Tutor)
 */
const chat = async (messages, model = "llama-3.3-70b-versatile") => {
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: messages,
            model: model,
            temperature: 0.7,
        });
        return chatCompletion.choices[0]?.message?.content;
    } catch (error) {
        console.error('Groq Chat API error:', error);
        throw error;
    }
};

/**
 * Hàm trích xuất từ vựng từ văn bản PDF (Giải pháp thay thế cho Gemini)
 */
const extractVocabFromText = async (text) => {
    const prompt = `Bạn là chuyên gia ngôn ngữ. Hãy trích xuất TỐI ĐA 50 từ vựng tiếng Anh có giá trị học thuật từ đoạn văn bản sau. BỎ QUA các từ thông dụng như: the, a, is, are, and, or, in, on, at.
Trả về MẢNG JSON thuần chứa các object có key: word, meaning, pronunciation, example_sentence, part_of_speech. KHÔNG KÈM MARKDOWN.

Văn bản cần xử lý:
${text}`;
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.2,
        });
        const responseText = chatCompletion.choices[0]?.message?.content;
        return JSON.parse(cleanJsonResponse(responseText));
    } catch (error) {
        console.error('Groq Extract Vocab Error:', error);
        throw error;
    }
};

// Hàm phụ trợ để làm sạch JSON (nếu cần)
function cleanJsonResponse(text) {
    let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    const match = cleaned.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    return match ? match[0] : cleaned;
}

module.exports = { chat, extractVocabFromText };