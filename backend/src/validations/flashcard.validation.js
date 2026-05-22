const Joi = require('joi');

const autoFillSchema = Joi.object({
  word: Joi.string().trim().required().messages({
    'string.empty': 'Vui lòng nhập từ vựng cần tra cứu.',
  }),
});

const flashcardSchema = Joi.object({
  set_id: Joi.number().integer().min(1).required(),
  word: Joi.string().trim().required().messages({ 'string.empty': 'Từ vựng không được để trống.' }),
  meaning: Joi.string().trim().required().messages({ 'string.empty': 'Nghĩa của từ không được để trống.' }),
  pronunciation: Joi.string().trim().allow(null, '').optional(),
  example_sentence: Joi.string().trim().allow(null, '').optional(),
  part_of_speech: Joi.string().trim().allow(null, '').optional(),
});

const updateFlashcardSchema = Joi.object({
  word: Joi.string().trim().optional(),
  meaning: Joi.string().trim().optional(),
  pronunciation: Joi.string().trim().allow(null, '').optional(),
  example_sentence: Joi.string().trim().allow(null, '').optional(),
  part_of_speech: Joi.string().trim().allow(null, '').optional(),
}).min(1);

module.exports = {
  autoFillSchema,
  flashcardSchema,
  updateFlashcardSchema,
};