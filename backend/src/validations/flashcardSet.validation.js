const Joi = require('joi');

const createSetSchema = Joi.object({
  service_id: Joi.number().integer().min(1).required().messages({
    'any.required': 'Vui lòng chọn danh mục cho bộ thẻ.',
  }),
  title: Joi.string().trim().min(3).max(255).required().messages({
    'string.empty': 'Tiêu đề bộ thẻ không được để trống.',
    'string.min': 'Tiêu đề bộ thẻ phải có ít nhất 3 ký tự.',
  }),
  description: Joi.string().trim().max(1000).allow(null, '').optional(),
});

const updateSetSchema = Joi.object({
  title: Joi.string().trim().min(3).max(255).optional(),
  description: Joi.string().trim().max(1000).allow(null, '').optional(),
}).min(1).messages({
  'object.min': 'Vui lòng cung cấp ít nhất 1 trường (title hoặc description) để cập nhật.',
});

const toggleSrsSchema = Joi.object({
  is_srs_enabled: Joi.boolean().required(),
  daily_new_words: Joi.number().integer().min(1).max(100).optional(),
});

module.exports = {
  createSetSchema,
  updateSetSchema,
  toggleSrsSchema,
};