const Joi = require("joi");

const createSetSchema = Joi.object({
  service_id: Joi.number().integer().min(1).required(),
  title: Joi.string().min(3).max(255).required(),
  description: Joi.string().max(1000).optional(),
});

const updateSetSchema = Joi.object({
  title: Joi.string().min(3).max(255).optional(),
  description: Joi.string().max(1000).optional(),
}).min(1);

const toggleSrsSchema = Joi.object({
  is_srs_enabled: Joi.boolean().required(),
  daily_new_words: Joi.number().integer().min(1).max(100).optional(),
});

// Schema mới cho thêm flashcard vào bộ thẻ
const createFlashcardSchema = Joi.object({
  word: Joi.string().min(1).required(),
  meaning: Joi.string().min(1).required(),
  pronunciation: Joi.string().allow('', null).optional(),
  example_sentence: Joi.string().allow('', null).optional(),
  part_of_speech: Joi.string().allow('', null).optional(),
});

module.exports = {
  createSetSchema,
  updateSetSchema,
  toggleSrsSchema,
  createFlashcardSchema,
};