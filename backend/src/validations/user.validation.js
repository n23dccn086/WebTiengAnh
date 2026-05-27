const Joi = require('joi');

exports.updateProfileSchema = Joi.object({
  full_name: Joi.string().min(2).optional().messages({
    'string.min': 'Họ và tên phải có ít nhất 2 ký tự.'
  }),
  dob: Joi.date().iso().optional().allow(null, '').messages({
    'date.format': 'Ngày sinh không đúng định dạng YYYY-MM-DD.'
  }),
  phone: Joi.string().min(9).max(15).optional().allow(null, '').pattern(/^[0-9]+$/).messages({
    'string.pattern.base': 'Số điện thoại chỉ được chứa chữ số.',
    'string.min': 'Số điện thoại phải có ít nhất 9 số.',
    'string.max': 'Số điện thoại tối đa 15 số.'
  })
}).min(1);

exports.changePasswordSchema = Joi.object({
  old_password: Joi.string().required().messages({
    'any.required': 'Vui lòng nhập mật khẩu cũ.'
  }),
  new_password: Joi.string().pattern(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{6,}$/).required().messages({
    'string.pattern.base': 'Mật khẩu mới phải có ít nhất 6 ký tự, gồm 1 chữ hoa, 1 số và 1 ký tự đặc biệt.',
    'any.required': 'Vui lòng nhập mật khẩu mới.'
  })
});