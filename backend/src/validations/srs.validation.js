const Joi = require('joi');

const reviewSchema = Joi.object({
  flashcard_id: Joi.number().integer().required().messages({
    'any.required': 'Vui lòng cung cấp ID của thẻ từ vựng.',
  }),
  rating: Joi.string().valid('AGAIN', 'HARD', 'GOOD', 'EASY').required().messages({
    'any.only': 'Đánh giá (rating) chỉ được là AGAIN, HARD, GOOD, hoặc EASY.',
    'any.required': 'Vui lòng đánh giá độ khó của thẻ.',
  }),
});

const learnNewSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(20).messages({
    'number.min': 'Số lượng từ mới phải lớn hơn 0.',
    'number.max': 'Chỉ nên học tối đa 100 từ mới mỗi ngày.',
  }),
});

module.exports = {
  reviewSchema,
  learnNewSchema,
};