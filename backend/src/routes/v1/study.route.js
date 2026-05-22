const express = require('express');
const router = express.Router();
const { protect } = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const studyController = require('../../controllers/study.controller');
const { generateQuestionsSchema, autoSaveSchema } = require('../../validations/study.validation');

// Tất cả API phần Study đều cần đăng nhập
router.use(protect);

// API 2: Sinh câu hỏi Practice
router.post('/:setId/practice', validate(generateQuestionsSchema), studyController.generatePractice);

// API 3: Tạo phiên Test
router.post('/:setId/test', validate(generateQuestionsSchema), studyController.createTest);

// Lịch sử test phải đặt trên các route chứa params :attemptId để tránh bị đè route (Express sẽ tưởng "history" là attemptId)
// API 6: Xem lịch sử Test
router.get('/tests/history/:setId', studyController.getHistory);

// API 4 & 5: Lưu nháp và Nộp bài
router.patch('/tests/:attemptId/auto-save', validate(autoSaveSchema), studyController.autoSaveProgress);
router.post('/tests/:attemptId/submit', studyController.submitTest);

module.exports = router;