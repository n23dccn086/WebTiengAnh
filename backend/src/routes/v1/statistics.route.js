const express = require('express');
const router = express.Router();
const { protect } = require('../../middlewares/auth.middleware');
const statisticsController = require('../../controllers/statistics.controller');

router.get('/dashboard', protect, statisticsController.getPremiumDashboard);
router.get('/overview', protect, statisticsController.getHomeOverview);

module.exports = router;