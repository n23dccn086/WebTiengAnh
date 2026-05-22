const StudyService = require('../services/study.service');
const catchAsync = require('../utils/catchAsync');
const { successResponse } = require('../utils/response.helper');

// API 2: Sinh câu hỏi Practice (Không lưu DB)
const generatePractice = catchAsync(async (req, res) => {
  const setId = parseInt(req.params.setId, 10);
  const { num_questions } = req.body;

  const data = await StudyService.generatePractice(req.user, setId, num_questions);
  return successResponse(res, "Sinh câu hỏi ôn tập thành công", data);
});

// API 3: Tạo phiên Test (Có lưu DB)
const createTest = catchAsync(async (req, res) => {
  const setId = parseInt(req.params.setId, 10);
  const { num_questions } = req.body;

  const data = await StudyService.createTest(req.user, setId, num_questions);
  return res.status(201).json({
    status: "success",
    message: "Tạo bài kiểm tra thành công",
    data: data
  });
});

// API 4: Lưu nháp tiến độ
const autoSaveProgress = catchAsync(async (req, res) => {
  const attemptId = parseInt(req.params.attemptId, 10);
  const { answers } = req.body;

  await StudyService.saveProgress(req.user.id, attemptId, answers);
  return successResponse(res, "Đã lưu nháp tiến độ");
});

// API 5: Nộp bài Test
const submitTest = catchAsync(async (req, res) => {
  const attemptId = parseInt(req.params.attemptId, 10);

  const data = await StudyService.submitTest(req.user.id, attemptId);
  return successResponse(res, "Nộp bài thành công", data);
});

// API 6: Lịch sử làm bài
const getHistory = catchAsync(async (req, res) => {
  const setId = parseInt(req.params.setId, 10);

  const data = await StudyService.getHistory(req.user.id, setId);
  return successResponse(res, "Lấy lịch sử làm bài thành công", data);
});

module.exports = {
  generatePractice,
  createTest,
  autoSaveProgress,
  submitTest,
  getHistory
};