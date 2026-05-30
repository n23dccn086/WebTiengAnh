const Joi = require("joi");

const generateQuestionsSchema = Joi.object({
  num_questions: Joi.number().integer().min(5).max(50).required().messages({
    "number.min": "Vui lòng chọn ít nhất 5 câu hỏi.",
    "number.max":
      "Chỉ được sinh tối đa 50 câu hỏi mỗi lần để đảm bảo AI không bị ngợp.",
    "any.required": "Vui lòng cung cấp số lượng câu hỏi (num_questions).",
  }),
});

const autoSaveSchema = Joi.object({
  answers: Joi.array()
    .items(
      Joi.object({
        question_id: Joi.number().integer().required(),
        selected_option_id: Joi.number().integer().required(),
      }),
    )
    .min(1)
    .required()
    .messages({
      "array.min": "Mảng answers phải chứa ít nhất 1 câu trả lời.",
      "any.required": "Vui lòng cung cấp mảng answers.",
    }),
});

// ✅ Thêm schema riêng cho createTest (cho phép resume_attempt_id)
const createTestSchema = Joi.object({
  num_questions: Joi.number().integer().min(1).max(50).default(10),

  resume_attempt_id: Joi.number().integer().positive().optional().allow(null),

  force_new: Joi.boolean().optional().default(false),
});

module.exports = {
  generateQuestionsSchema,
  autoSaveSchema,
  createTestSchema, // export thêm
};
