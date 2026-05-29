const express = require('express');
const router = express.Router();
const { protect } = require('../../middlewares/auth.middleware');
const aiController = require('../../controllers/ai.controller');

router.use(protect);

// Chat tự do (không cần setId)
router.post('/chat', aiController.freeChat);

module.exports = router;