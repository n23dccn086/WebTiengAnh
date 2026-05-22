const express = require('express');
const router = express.Router();
const { protect } = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const srsController = require('../../controllers/srs.controller');
const { reviewSchema, learnNewSchema } = require('../../validations/srs.validation');

// Tất cả API SRS đều cần đăng nhập
router.use(protect);

// API 7: Lấy từ cần ôn hôm nay
router.get('/today', srsController.getTodayCards);

// API 8: Chấm điểm (AGAIN, HARD, GOOD, EASY)
router.post('/review', validate(reviewSchema), srsController.reviewCard);

// API 9: Bắt đầu học (kéo thẻ NEW vào)
router.post('/start', srsController.startLearning);

// API 10: Học thêm từ mới
router.post('/learn-new', validate(learnNewSchema), srsController.learnMoreNewCards);

module.exports = router;