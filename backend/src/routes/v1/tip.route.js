const express = require('express');
const router = express.Router();
const tipController = require('../../controllers/tip.controller');

router.get('/random-word', tipController.getRandomWord);

module.exports = router;