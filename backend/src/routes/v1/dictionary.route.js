const express = require('express');
const router = express.Router();
const { protect } = require('../../middlewares/auth.middleware');
const dictionaryController = require('../../controllers/dictionary.controller');
const validate = require('../../middlewares/validate.middleware');
const Joi = require('joi');

const autoFillSchema = Joi.object({
  word: Joi.string().required().min(1)
});

router.post('/auto-fill', protect, validate(autoFillSchema), dictionaryController.autoFill);

module.exports = router;