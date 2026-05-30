const Joi = require('joi');

const createSetSchema = Joi.object({
  service_id: Joi.number().integer().min(1).required(),
  title: Joi.string().trim().min(1).max(255).required(),
  description: Joi.string().trim().max(1000).allow(null, '').optional(),
});

const updateSetSchema = Joi.object({
  title: Joi.string().trim().min(1).max(255).optional(),
  description: Joi.string().trim().max(1000).allow(null, '').optional(),
}).min(1);

const toggleSrsSchema = Joi.object({
  is_srs_enabled: Joi.boolean().required(),
  daily_new_words: Joi.number().integer().min(1).max(100).optional(),
  deleteFromLibrary: Joi.boolean().optional()
});

module.exports = {
  createSetSchema,
  updateSetSchema,
  toggleSrsSchema,
};