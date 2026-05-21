const express = require("express");
const router = express.Router();
const { protect } = require("../../middlewares/auth.middleware");
const studyController = require("../../controllers/study.controller");

router.use(protect);
router.post("/:setId/practice", studyController.practice);
router.post("/:setId/test", studyController.createTest);

module.exports = router;