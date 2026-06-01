const express = require('express');
const router = express.Router();
const { protect } = require('../../middlewares/auth.middleware');
const chatController = require('../../controllers/chat.controller');

router.use(protect);
router.post('/send', chatController.sendMessage);
router.get('/messages', chatController.getMessages);

module.exports = router;