const express = require("express");
const router = express.Router();
const { protect } = require("../../middlewares/auth.middleware");
const srsController = require("../../controllers/srs.controller");

router.use(protect);
router.get("/today", srsController.getTodayReviews);
router.post("/review", srsController.submitReview);
router.post("/complete", srsController.completeSession);

module.exports = router;