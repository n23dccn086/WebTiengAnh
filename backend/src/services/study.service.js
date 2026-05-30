const GeminiService = require("./gemini.service");
const FlashcardModel = require("../models/flashcard.model");
const UserModel = require("../models/user.model");
const StudyModel = require("../models/study.model");
const AppError = require("../utils/appError");
const db = require("../config/database");

const TEST_TIME_LIMIT_MS = 16 * 60 * 1000; // 15 phút + 1 phút buffer bù trừ mạng

// Helper: kiểm tra nếu không phải admin/super admin thì mới kiểm tra quota
const checkQuota = (user) => {
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    if (user.ai_quota <= 0) {
      throw new AppError(
        429,
        "Bạn đã hết lượt sử dụng AI hôm nay. Vui lòng thử lại sau 24 giờ hoặc nâng cấp Premium.",
        "QUOTA_AI_EXCEEDED",
      );
    }
  }
};

// ===================================
// CHẾ ĐỘ PRACTICE (ÔN TẬP NHANH)
// ===================================
const generatePractice = async (user, setId, numQuestions) => {
  checkQuota(user);

  const flashcards = await FlashcardModel.getFlashcardsBySet(setId);
  if (flashcards.length === 0)
    throw new AppError(
      400,
      "Bộ thẻ này chưa có từ vựng nào để học.",
      "EMPTY_SET",
    );

  try {
    const questions = await GeminiService.generateQuestions(
      flashcards,
      numQuestions,
    );
    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      await UserModel.decrementAiQuota(user.id);
    }
    return { questions };
  } catch (error) {
    if (error.statusCode === 429) throw error;
    throw new AppError(
      500,
      "Không thể sinh câu hỏi do lỗi AI, vui lòng thử lại.",
      "AI_SERVICE_ERROR",
    );
  }
};

// ===================================
// CHẾ ĐỘ TEST (THI THỬ - CÓ LƯU ĐIỂM)
// ===================================
const createTest = async (user, setId, numQuestions, options = {}) => {
  const { resume_attempt_id = null, force_new = false } =
    typeof options === "object" && options !== null
      ? options
      : { resume_attempt_id: options, force_new: false };

  const finalNumQuestions = Number(numQuestions) || 10;

  // 1. Nếu không phải "Làm lại", ưu tiên mở bài đang dở
  if (!force_new) {
    let inProgress = null;

    if (resume_attempt_id) {
      const [attempts] = await db.execute(
        `SELECT id, started_at
         FROM test_attempts
         WHERE id = ?
           AND user_id = ?
           AND set_id = ?
           AND status = 'IN_PROGRESS'
         LIMIT 1`,
        [resume_attempt_id, user.id, setId],
      );

      if (attempts.length > 0) {
        inProgress = attempts[0];
      }
    } else {
      const [attempts] = await db.execute(
        `SELECT id, started_at
         FROM test_attempts
         WHERE user_id = ?
           AND set_id = ?
           AND status = 'IN_PROGRESS'
         ORDER BY id DESC
         LIMIT 1`,
        [user.id, setId],
      );

      if (attempts.length > 0) {
        inProgress = attempts[0];
      }
    }

    if (inProgress) {
      const questions = await StudyModel.getTestQuestionsWithOptions(
        inProgress.id,
      );

      const startTime = new Date(inProgress.started_at).getTime();
      const timeElapsed = Number.isNaN(startTime) ? 0 : Date.now() - startTime;

      const remainingSeconds = Math.max(
        0,
        Math.floor((TEST_TIME_LIMIT_MS - timeElapsed) / 1000),
      );

      return {
        is_resume: true,
        attempt_id: inProgress.id,
        message: "Tiếp tục bài thi đang dang dở",
        started_at: inProgress.started_at,
        questions,
        remaining_seconds: remainingSeconds,
      };
    }
  }

  // 2. Chỉ tới đây khi không có bài dở hoặc user bấm "Làm lại"
  checkQuota(user);

  const flashcards = await FlashcardModel.getFlashcardsBySet(setId);

  if (flashcards.length === 0) {
    throw new AppError(400, "Bộ thẻ trống.", "EMPTY_SET");
  }

  let questionsData;

  try {
    questionsData = await GeminiService.generateQuestions(
      flashcards,
      finalNumQuestions,
    );

    if (!questionsData || questionsData.length === 0) {
      if (questionsData && questionsData.questions) {
        questionsData = questionsData.questions;
      } else {
        throw new AppError(500, "Lỗi tạo câu hỏi.", "AI_GENERATE_FAILED");
      }
    }

    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      await UserModel.decrementAiQuota(user.id);
    }
  } catch (error) {
    if (error.statusCode === 429) {
      throw error;
    }

    throw new AppError(
      500,
      "AI không sinh được câu hỏi. Vui lòng thử lại.",
      "AI_GENERATE_FAILED",
    );
  }

  const { attemptId, frontendQuestions } =
    await StudyModel.saveFullTestTransaction(user.id, setId, questionsData);

  return {
    is_resume: false,
    attempt_id: attemptId,
    message: "Tạo bài thi mới thành công",
    questions: frontendQuestions,
    remaining_seconds: TEST_TIME_LIMIT_MS / 1000,
  };
};

// ===================================
// LƯU NHÁP VÀ NỘP BÀI
// ===================================
const saveProgress = async (userId, attemptId, answers) => {
  await Promise.all(
    answers.map((ans) =>
      StudyModel.saveTestAnswer(
        attemptId,
        ans.question_id,
        ans.selected_option_id,
      ),
    ),
  );
  await StudyModel.updateLastSaved(attemptId);
};

const submitTest = async (userId, attemptId) => {
  const questions = await StudyModel.getQuestionsForGrading(attemptId);
  if (!questions.length) {
    throw new AppError(
      404,
      "Không tìm thấy câu hỏi cho bài test này",
      "TEST_NOT_FOUND",
    );
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
      explanation: q.explanation,
    });
  }

  const total = questions.length;
  const score = total === 0 ? 0 : (correctCount / total) * 100;
  const scoreFixed = parseFloat(score.toFixed(2));

  await StudyModel.updateTestScore(attemptId, correctCount, scoreFixed);
  return {
    score: scoreFixed,
    correct_count: correctCount,
    total_questions: total,
    results,
  };
};

const getHistory = async (userId, setId) => {
  return await StudyModel.getTestHistory(userId, setId);
};

const deleteTestAttempt = async (userId, attemptId) => {
  const [attempt] = await db.execute(
    `SELECT id FROM test_attempts WHERE id = ? AND user_id = ?`,
    [attemptId, userId],
  );
  if (attempt.length === 0) {
    throw new AppError(404, "Không tìm thấy bài test", "NOT_FOUND");
  }
  await db.execute(`DELETE FROM test_attempts WHERE id = ?`, [attemptId]);
};

// ===================================
// REVIEW TEST & AI CHAT
// ===================================
const getTestDetail = async (userId, attemptId) => {
  const attemptInfo = await StudyModel.getAttemptById(userId, attemptId);
  if (!attemptInfo)
    throw new AppError(404, "Không tìm thấy bài test", "NOT_FOUND");

  const questions = await StudyModel.getTestReviewDetail(attemptId);

  return {
    ...attemptInfo,
    questions: questions,
  };
};

const chatWithAI = async (
  user,
  setId,
  message,
  chatHistory,
  currentQuestion,
) => {
  checkQuota(user);
  if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
    await UserModel.decrementAiQuota(user.id);
  }

  const reply = await GeminiService.chatTutor(
    message,
    chatHistory,
    currentQuestion,
  );
  return { reply: reply, remaining_quota: Math.max(0, user.ai_quota - 1) };
};

module.exports = {
  generatePractice,
  createTest,
  saveProgress,
  submitTest,
  getHistory,
  deleteTestAttempt,
  getTestDetail,
  chatWithAI,
};
