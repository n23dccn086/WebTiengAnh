const { validationResult } = require("express-validator");
const { errorResponse } = require("../utils/response.helper");

function validate(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorList = errors.array();
    const firstError = errorList[0];

    return errorResponse(
      res,
      firstError.msg || "Dữ liệu không hợp lệ.",
      "VALIDATION_ERROR",
      400,
    );
  }

  next();
}

module.exports = validate;
