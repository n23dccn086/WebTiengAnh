const express = require('express');
const router = express.Router();
const { protect } = require('../../middlewares/auth.middleware');
const staticQuizController = require('../../controllers/staticQuiz.controller');

// Lấy danh sách bộ đề (có thể lọc theo service_id)
router.get('/', protect, staticQuizController.getQuizzes);

// Lấy chi tiết một bộ đề (kèm câu hỏi và đáp án)
router.get('/:id', protect, staticQuizController.getQuizDetail);

module.exports = router;