const StudyService = require("../services/study.service");
const catchAsync = require("../utils/catchAsync");
const { successResponse } = require("../utils/response.helper");

const generatePractice = catchAsync(async (req, res) => {
  const setId = parseInt(req.params.setId, 10);
  const { num_questions } = req.body;
  const data = await StudyService.generatePractice(
    req.user,
    setId,
    num_questions,
  );
  return successResponse(res, "Sinh câu hỏi ôn tập thành công", data);
});

const createTest = catchAsync(async (req, res) => {
  const setId = parseInt(req.params.setId, 10);

  const {
    num_questions = 10,
    resume_attempt_id = null,
    force_new = false,
  } = req.body || {};

  const data = await StudyService.createTest(
    req.user,
    setId,
    Number(num_questions),
    {
      resume_attempt_id,
      force_new,
    },
  );

  return res.status(data.is_resume ? 200 : 201).json({
    status: "success",
    message: data.message || "Tạo bài kiểm tra thành công",
    data,
  });
});
const autoSaveProgress = catchAsync(async (req, res) => {
  const attemptId = parseInt(req.params.attemptId, 10);
  const { answers } = req.body;
  await StudyService.saveProgress(req.user.id, attemptId, answers);
  return successResponse(res, "Đã lưu nháp tiến độ");
});

const submitTest = catchAsync(async (req, res) => {
  const attemptId = parseInt(req.params.attemptId, 10);
  const data = await StudyService.submitTest(req.user.id, attemptId);
  return successResponse(res, "Nộp bài thành công", data);
});

const getHistory = catchAsync(async (req, res) => {
  const setId = parseInt(req.params.setId, 10);
  const data = await StudyService.getHistory(req.user.id, setId);
  return successResponse(res, "Lấy lịch sử thành công", data);
});

// THÊM MỚI TỪ NHÁNH CỦA BẠN: Controller lấy chi tiết bài test
const getTestDetail = catchAsync(async (req, res) => {
  const attemptId = parseInt(req.params.attemptId, 10);
  const data = await StudyService.getTestDetail(req.user.id, attemptId);
  return successResponse(res, "Lấy chi tiết bài test thành công", data);
});

// THÊM MỚI TỪ NHÁNH CỦA BẠN: Controller Chat AI
const chatWithAI = catchAsync(async (req, res) => {
  const setId = parseInt(req.params.setId, 10);
  const { message, chat_history, current_question } = req.body;

  if (!message)
    return res.status(400).json({ status: "fail", message: "Trống tin nhắn." });

  const data = await StudyService.chatWithAI(
    req.user,
    setId,
    message,
    chat_history,
    current_question,
  );
  return successResponse(res, "Chat thành công", data);
});

// TỪ NHÁNH HEAD: Controller Xóa bài Test
const deleteTestAttempt = catchAsync(async (req, res) => {
  const attemptId = parseInt(req.params.attemptId, 10);
  await StudyService.deleteTestAttempt(req.user.id, attemptId);
  return successResponse(res, "Đã xóa bài test thành công");
});

// GỘP CHUNG TẤT CẢ MODULE EXPORTS ĐỂ KHÔNG SÓT HÀM
module.exports = {
  generatePractice,
  createTest,
  autoSaveProgress,
  submitTest,
  getHistory,
  getTestDetail,
  chatWithAI,
  deleteTestAttempt,
};
