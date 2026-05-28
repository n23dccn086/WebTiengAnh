const StudyService = require('../services/study.service');
const catchAsync = require('../utils/catchAsync');
const { successResponse } = require('../utils/response.helper');

const generatePractice = catchAsync(async (req, res) => {
  const setId = parseInt(req.params.setId, 10);
  const { num_questions } = req.body;
  const data = await StudyService.generatePractice(req.user, setId, num_questions);
  return successResponse(res, "Sinh câu hỏi ôn tập thành công", data);
});

const createTest = catchAsync(async (req, res) => {
  const setId = parseInt(req.params.setId, 10);
  const { num_questions, resume_attempt_id } = req.body;
  const data = await StudyService.createTest(req.user, setId, num_questions, resume_attempt_id);
  return res.status(201).json({
    status: "success",
    message: "Tạo bài kiểm tra thành công",
    data: data
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
  return successResponse(res, "Lấy lịch sử làm bài thành công", data);
});

const deleteTestAttempt = catchAsync(async (req, res) => {
  const attemptId = parseInt(req.params.attemptId, 10);
  await StudyService.deleteTestAttempt(req.user.id, attemptId);
  return successResponse(res, "Đã xóa bài test thành công");
});

module.exports = {
  generatePractice,
  createTest,
  autoSaveProgress,
  submitTest,
  getHistory,
  deleteTestAttempt
};