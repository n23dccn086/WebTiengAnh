const Joi = require('joi');

const changeUserStatusSchema = Joi.object({
  status: Joi.string().valid('ACTIVE', 'BANNED', 'UNVERIFIED').required().messages({
    'any.only': 'Trạng thái chỉ được là ACTIVE, BANNED hoặc UNVERIFIED',
    'any.required': 'Vui lòng cung cấp trạng thái (status)'
  })
});

const changeUserRoleSchema = Joi.object({
  role: Joi.string().valid('USER', 'PREMIUM', 'ADMIN').required().messages({
    'any.only': 'Quyền chỉ được là USER, PREMIUM hoặc ADMIN',
    'any.required': 'Vui lòng cung cấp phân quyền (role)'
  })
});

const serviceSchema = Joi.object({
  title: Joi.string().min(3).max(255).required().messages({
    'string.empty': 'Tiêu đề không được để trống',
    'string.min': 'Tiêu đề phải có ít nhất 3 ký tự'
  }),
  description: Joi.string().allow('', null),
  status: Joi.string().valid('VISIBLE', 'HIDDEN').default('VISIBLE')
});

const createSystemFlashcardSetSchema = Joi.object({
  title: Joi.string().required().messages({
    'string.empty': 'Tiêu đề bộ thẻ không được để trống'
  }),
  service_id: Joi.number().integer().required().messages({
    'number.base': 'Service ID phải là một số'
  }),
  flashcards: Joi.array().items(
    Joi.object({
      word: Joi.string().required(),
      meaning: Joi.string().required(),
      pronunciation: Joi.string().allow('', null),
      example_sentence: Joi.string().allow('', null),
      part_of_speech: Joi.string().allow('', null)
    })
  ).min(1).required().messages({
    'array.min': 'Bộ thẻ phải có ít nhất 1 từ vựng (flashcard)'
  })
});

const createStaffSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email không hợp lệ'
  }),
  full_name: Joi.string().min(2).required(),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Mật khẩu phải có ít nhất 6 ký tự'
  })
});

const resetStaffPasswordSchema = Joi.object({
  new_password: Joi.string().min(6).required().messages({
    'string.min': 'Mật khẩu mới phải có ít nhất 6 ký tự',
    'any.required': 'Vui lòng cung cấp mật khẩu mới'
  })
});

module.exports = {
  changeUserStatusSchema,
  changeUserRoleSchema,
  serviceSchema,
  createSystemFlashcardSetSchema,
  createStaffSchema,
  resetStaffPasswordSchema
};