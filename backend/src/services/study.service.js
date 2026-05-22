const GeminiService = require('./gemini.service');
const FlashcardModel = require('../models/flashcard.model');
const UserModel = require('../models/user.model');
const StudyModel = require('../models/study.model');
const AppError = require('../utils/appError');

// ===================================
// CHẾ ĐỘ PRACTICE (ÔN TẬP NHANH)
// ===================================
const generatePractice = async (user, setId, numQuestions) => {
  if (user.ai_quota <= 0) throw new AppError(403, 'Bạn đã hết lượt sử dụng AI hôm nay.', 'QUOTA_AI_EXCEEDED');

  const flashcards = await FlashcardModel.getFlashcardsBySet(setId);
  if (flashcards.length === 0) throw new AppError(400, 'Bộ thẻ này chưa có từ vựng nào để học.', 'EMPTY_SET');

  await UserModel.decrementAiQuota(user.id);
  const questions = await GeminiService.generateQuestions(flashcards, numQuestions);

  return { questions };
};

// ===================================
// CHẾ ĐỘ TEST (THI THỬ - CÓ LƯU ĐIỂM)
// ===================================
const createTest = async (user, setId, numQuestions) => {
  // 1. [TÍNH NĂNG RESUME TEST]: Check xem user có đang thi dở không
  const inProgress = await StudyModel.getInProgressAttempt(user.id, setId);
  if (inProgress) {
    const questions = await StudyModel.getTestQuestionsWithOptions(inProgress.id);
    return { 
      attempt_id: inProgress.id, 
      message: "Tiếp tục bài thi đang dang dở", 
      questions: questions 
    };
  }

  // 2. [TÍNH NĂNG TẠO MỚI]: Nếu chưa thi dở thì mới check Quota và gọi AI
  if (user.ai_quota <= 0) throw new AppError(403, 'Hết lượt AI hôm nay.', 'QUOTA_AI_EXCEEDED');

  const flashcards = await FlashcardModel.getFlashcardsBySet(setId);
  if (flashcards.length === 0) throw new AppError(400, 'Bộ thẻ trống.', 'EMPTY_SET');

  await UserModel.decrementAiQuota(user.id);
  
  let questionsData = await GeminiService.generateQuestions(flashcards, numQuestions);
  if (!questionsData || questionsData.length === 0) {
      if (questionsData && questionsData.questions) {
          questionsData = questionsData.questions;
      } else {
          throw new AppError(500, 'AI không sinh được câu hỏi. Vui lòng thử lại.', 'AI_GENERATE_FAILED');
      }
  }

  // 3. Đẩy toàn bộ dữ liệu xuống Model để thực hiện SQL Transaction
  const { attemptId, frontendQuestions } = await StudyModel.saveFullTestTransaction(user.id, setId, questionsData);

  return { attempt_id: attemptId, message: "Tạo bài kiểm tra mới thành công", questions: frontendQuestions };
};

// ===================================
// LƯU NHÁP VÀ NỘP BÀI
// ===================================
const saveProgress = async (userId, attemptId, answers) => {
  for (const ans of answers) {
    await StudyModel.saveTestAnswer(attemptId, ans.question_id, ans.selected_option_id);
  }
};

const submitTest = async (userId, attemptId) => {
  const questions = await StudyModel.getQuestionsForGrading(attemptId);
  
  let correctCount = 0;
  const results = [];

  for (const q of questions) {
    const isCorrect = q.selected_option_id === q.correct_option_id;
    if (isCorrect) correctCount++;
    
    results.push({
      question_id: q.id,
      selected_option_id: q.selected_option_id,
      correct_option_id: q.correct_option_id,
      is_correct: isCorrect,
      explanation: q.explanation // Chấm điểm xong mới trả giải thích
    });
  }

  const score = (correctCount / questions.length) * 100;
  await StudyModel.updateTestScore(attemptId, correctCount, parseFloat(score.toFixed(2)));

  return { score: parseFloat(score.toFixed(2)), correct_count: correctCount, results };
};

const getHistory = async (userId, setId) => {
  return await StudyModel.getTestHistory(userId, setId);
};

module.exports = {
  generatePractice,
  createTest,
  saveProgress,
  submitTest,
  getHistory
};