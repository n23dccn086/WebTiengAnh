const express = require('express');
const router = express.Router();
const { protect } = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const studyController = require('../../controllers/study.controller');
const { generateQuestionsSchema, autoSaveSchema, createTestSchema } = require('../../validations/study.validation');

router.use(protect);

router.post('/:setId/practice', validate(generateQuestionsSchema), studyController.generatePractice);
router.post('/:setId/test', validate(createTestSchema), studyController.createTest);
router.get('/tests/history/:setId', studyController.getHistory);
router.patch('/tests/:attemptId/auto-save', validate(autoSaveSchema), studyController.autoSaveProgress);
router.post('/tests/:attemptId/submit', studyController.submitTest);
router.delete('/tests/:attemptId', studyController.deleteTestAttempt);

module.exports = router;