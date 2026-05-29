const express = require('express');
const router = express.Router();
const { protect } = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const studyController = require('../../controllers/study.controller');
const { generateQuestionsSchema, autoSaveSchema, createTestSchema } = require('../../validations/study.validation');

// Tất cả API phần Study đều cần đăng nhập
router.use(protect);

// API Practice & Test
router.post('/:setId/practice', validate(generateQuestionsSchema), studyController.generatePractice);
router.post('/:setId/test', validate(createTestSchema), studyController.createTest);

// Lịch sử test
router.get('/tests/history/:setId', studyController.getHistory);

// API Lấy chi tiết bài test để xem lại (Review)
router.get('/tests/attempts/:attemptId', studyController.getTestDetail);

// API Lưu nháp, Nộp bài và Xóa bài test
router.patch('/tests/:attemptId/auto-save', validate(autoSaveSchema), studyController.autoSaveProgress);
router.post('/tests/:attemptId/submit', studyController.submitTest);
router.delete('/tests/:attemptId', studyController.deleteTestAttempt);

// API Chat AI Tutor
router.post('/:setId/chat', studyController.chatWithAI);

module.exports = router;