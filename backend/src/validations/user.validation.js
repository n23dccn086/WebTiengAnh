const Joi = require('joi');

exports.updateProfileSchema = Joi.object({
  full_name: Joi.string().min(2).optional(),
  dob: Joi.date().iso().optional(),
  phone: Joi.string().min(9).max(15).optional()
}).min(1); // Ít nhất phải gửi lên 1 trường để sửa

exports.changePasswordSchema = Joi.object({
  old_password: Joi.string().required(),
  new_password: Joi.string().pattern(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{6,}$/).required()
});