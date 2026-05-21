const flashcardModel = require("../models/flashcard.model");
const flashcardSetModel = require("../models/flashcardSet.model");
const quizModel = require("../models/quiz.model");
const geminiService = require("../services/gemini.service");
const { successResponse } = require("../utils/response.helper");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// POST /api/v1/study/:setId/practice
exports.practice = catchAsync(async (req, res) => {
  const setId = parseInt(req.params.setId);
  // Lấy flashcards trong bộ thẻ
  const flashcards = await flashcardModel.getFlashcardsBySet(setId);
  if (flashcards.length < 4) {
    throw new AppError(400, "Cần ít nhất 4 từ vựng để tạo câu hỏi practice", "INSUFFICIENT_FLASHCARDS");
  }
  const questions = await geminiService.generatePracticeQuestions(flashcards);
  successResponse(res, "Tạo câu hỏi practice thành công", questions);
});

// POST /api/v1/study/:setId/test
exports.createTest = catchAsync(async (req, res) => {
  const setId = parseInt(req.params.setId);
  // Kiểm tra bộ thẻ tồn tại
  const set = await flashcardSetModel.getSetById(setId, req.user.id);
  if (!set) throw new AppError(404, "Bộ thẻ không tồn tại", "SET_NOT_FOUND");

  const flashcards = await flashcardModel.getFlashcardsBySet(setId);
  if (flashcards.length < 4) {
    throw new AppError(400, "Cần ít nhất 4 từ vựng để tạo đề thi", "INSUFFICIENT_FLASHCARDS");
  }

  // Sinh đề thi từ AI
  const testQuestions = await geminiService.generateTestQuestions(flashcards);
  // Tạo attempt
  const attemptId = await quizModel.createAttempt(req.user.id, setId);
  // Lưu câu hỏi và options
  await quizModel.saveQuestionsAndOptions(attemptId, testQuestions, flashcards);
  // Lấy lại câu hỏi vừa lưu (kèm options) để trả về frontend
  const questions = await quizModel.getQuestionsByAttempt(attemptId);
  successResponse(res, "Tạo đề thi thành công", { attempt_id: attemptId, questions });
});

// PATCH /api/v1/tests/:attemptId/auto-save
exports.autoSave = catchAsync(async (req, res) => {
  const attemptId = parseInt(req.params.attemptId);
  const { answers } = req.body; // answers = [{question_id, selected_option_id}]
  // Kiểm tra attempt có thuộc user không
  const isValid = await quizModel.verifyAttemptOwnership(attemptId, req.user.id);
  if (!isValid) throw new AppError(403, "Không có quyền truy cập bài test này", "FORBIDDEN");

  for (const ans of answers) {
    await quizModel.saveAnswer(attemptId, ans.question_id, ans.selected_option_id);
  }
  successResponse(res, "Đã lưu tiến độ");
});

// POST /api/v1/tests/:attemptId/submit
exports.submitTest = catchAsync(async (req, res) => {
  const attemptId = parseInt(req.params.attemptId);
  const isValid = await quizModel.verifyAttemptOwnership(attemptId, req.user.id);
  if (!isValid) throw new AppError(403, "Không có quyền truy cập bài test này", "FORBIDDEN");

  const result = await quizModel.submitAttempt(attemptId);
  successResponse(res, "Nộp bài thành công", result);
});