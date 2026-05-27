const { sendContactEmail } = require('../config/email');
const catchAsync = require('../utils/catchAsync');
const { successResponse } = require('../utils/response.helper');
const AppError = require('../utils/appError');

exports.sendContact = catchAsync(async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    throw new AppError(400, 'Vui lòng điền đầy đủ thông tin', 'MISSING_FIELDS');
  }
  await sendContactEmail(name, email, message);
  return successResponse(res, 'Gửi liên hệ thành công, chúng tôi sẽ phản hồi sớm nhất có thể.');
});