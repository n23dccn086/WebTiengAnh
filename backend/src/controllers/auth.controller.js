const authService = require('../services/auth.service');
const { loginSchema } = require('../validations/auth.validation');

const login = async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message,
        error_code: 'VALIDATION_ERROR'
      });
    }

    const { email, password } = value;
    const result = await authService.login(email, password);

    if (!result) {
      return res.status(401).json({
        status: 'error',
        message: 'Email hoặc mật khẩu không chính xác.',
        error_code: 'AUTH_INVALID_CREDENTIALS'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Đăng nhập thành công',
      data: result
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { login };