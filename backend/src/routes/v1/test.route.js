const express = require("express");
const router = express.Router();
const { protect } = require("../../middlewares/auth.middleware");
const studyController = require("../../controllers/study.controller");

router.use(protect);
router.patch("/:attemptId/auto-save", studyController.autoSave);
router.post("/:attemptId/submit", studyController.submitTest);

module.exports = router;