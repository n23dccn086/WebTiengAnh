const GeminiService = require('./gemini.service');
const FlashcardModel = require('../models/flashcard.model');
const UserModel = require('../models/user.model');
const StudyModel = require('../models/study.model');
const AppError = require('../utils/appError');

const generatePractice = async (user, setId, numQuestions) => {
  if (user.ai_quota <= 0) throw new AppError(429, 'Bạn đã hết lượt sử dụng AI hôm nay.', 'QUOTA_AI_EXCEEDED');

  const flashcards = await FlashcardModel.getFlashcardsBySet(setId);
  if (flashcards.length === 0) throw new AppError(400, 'Bộ thẻ này chưa có từ vựng nào để học.', 'EMPTY_SET');

  try {
    const questions = await GeminiService.generateQuestions(flashcards, numQuestions);
    await UserModel.decrementAiQuota(user.id);
    return { questions };
  } catch (error) {
    if (error.statusCode === 429) throw error; // quota exceeded, không trừ quota
    throw new AppError(500, 'Không thể sinh câu hỏi do lỗi AI, vui lòng thử lại.', 'AI_SERVICE_ERROR');
  }
};

const createTest = async (user, setId, numQuestions) => {
  const inProgress = await StudyModel.getInProgressAttempt(user.id, setId);
  if (inProgress) {
    const questions = await StudyModel.getTestQuestionsWithOptions(inProgress.id);
    return { attempt_id: inProgress.id, message: "Tiếp tục bài thi đang dang dở", questions };
  }

  if (user.ai_quota <= 0) throw new AppError(429, 'Hết lượt AI hôm nay.', 'QUOTA_AI_EXCEEDED');

  const flashcards = await FlashcardModel.getFlashcardsBySet(setId);
  if (flashcards.length === 0) throw new AppError(400, 'Bộ thẻ trống.', 'EMPTY_SET');

  let questionsData;
  try {
    questionsData = await GeminiService.generateQuestions(flashcards, numQuestions);
    await UserModel.decrementAiQuota(user.id);
  } catch (error) {
    if (error.statusCode === 429) throw error;
    throw new AppError(500, 'AI không sinh được câu hỏi. Vui lòng thử lại.', 'AI_GENERATE_FAILED');
  }

  if (!questionsData || questionsData.length === 0) {
    throw new AppError(500, 'AI không sinh được câu hỏi. Vui lòng thử lại.', 'AI_GENERATE_FAILED');
  }

  const { attemptId, frontendQuestions } = await StudyModel.saveFullTestTransaction(user.id, setId, questionsData);
  return { attempt_id: attemptId, message: "Tạo bài kiểm tra mới thành công", questions: frontendQuestions };
};

const saveProgress = async (userId, attemptId, answers) => {
  for (const ans of answers) {
    await StudyModel.saveTestAnswer(attemptId, ans.question_id, ans.selected_option_id);
  }
};

const submitTest = async (userId, attemptId) => {
  const questions = await StudyModel.getQuestionsForGrading(attemptId);
  if (!questions.length) {
    throw new AppError(404, 'Không tìm thấy câu hỏi cho bài test này', 'TEST_NOT_FOUND');
  }

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
      explanation: q.explanation
    });
  }

  const total = questions.length;
  const score = total === 0 ? 0 : (correctCount / total) * 100;
  const scoreFixed = parseFloat(score.toFixed(2));

  await StudyModel.updateTestScore(attemptId, correctCount, scoreFixed);
  return { score: scoreFixed, correct_count: correctCount, total_questions: total, results };
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