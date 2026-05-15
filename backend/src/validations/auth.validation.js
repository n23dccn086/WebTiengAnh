// File: src/validations/auth.validation.js
const Joi = require('joi');

// Regex mật khẩu: Ít nhất 6 ký tự, 1 hoa, 1 số, 1 ký tự đặc biệt
const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{6,}$/;
const passwordMessage = 'Mật khẩu phải có ít nhất 6 ký tự, gồm 1 chữ hoa, 1 chữ số và 1 ký tự đặc biệt.';

const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email không hợp lệ.',
    'any.required': 'Email không được để trống.',
  }),
  password: Joi.string().pattern(passwordRegex).required().messages({
    'string.pattern.base': passwordMessage,
    'any.required': 'Mật khẩu không được để trống.',
  }),
  full_name: Joi.string().min(2).required().messages({
    'string.min': 'Họ và tên phải có ít nhất 2 ký tự.',
    'any.required': 'Họ và tên không được để trống.',
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email không hợp lệ.',
    'any.required': 'Email không được để trống.',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Mật khẩu không được để trống.',
  }),
});

const verifyEmailSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Token xác thực không được để trống.',
  }),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email không hợp lệ.',
    'any.required': 'Email không được để trống.',
  }),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Token không được để trống.',
  }),
  new_password: Joi.string().pattern(passwordRegex).required().messages({
    'string.pattern.base': passwordMessage,
    'any.required': 'Mật khẩu mới không được để trống.',
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};