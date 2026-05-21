// Mock AI – thay bằng gọi Gemini thật sau
const generatePracticeQuestions = async (flashcards) => {
  // Tạo 5 câu hỏi mẫu từ flashcards đầu tiên
  const sample = flashcards.slice(0, 5);
  return sample.map(card => ({
    question: `Nghĩa của từ "${card.word}" là gì?`,
    options: [card.meaning, 'Đáp án sai 1', 'Đáp án sai 2', 'Đáp án sai 3'],
    correct_index: 0,
    explanation: `"${card.word}" có nghĩa là "${card.meaning}".`,
  }));
};

const generateTestQuestions = async (flashcards, numQuestions = 5) => {
  const selected = flashcards.slice(0, numQuestions);
  return selected.map(card => ({
    question: `Từ "${card.word}" có nghĩa là gì?`,
    options: [card.meaning, 'Lựa chọn B', 'Lựa chọn C', 'Lựa chọn D'],
    correct_index: 0,
    explanation: `Giải thích: ${card.meaning}.`,
  }));
};

module.exports = { generatePracticeQuestions, generateTestQuestions };