function successResponse(res, message, data = null, statusCode = 200) {
  return res.status(statusCode).json({
    status: "success",
    message,
    data,
  });
}

function errorResponse(
  res,
  message,
  errorCode = "COMMON_ERROR",
  statusCode = 400,
) {
  return res.status(statusCode).json({
    status: "error",
    message,
    error_code: errorCode,
  });
}

module.exports = {
  successResponse,
  errorResponse,
};
