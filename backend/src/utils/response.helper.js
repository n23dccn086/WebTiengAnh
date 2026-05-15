function successResponse(res, message, data = null, statusCode = 200) {
  return res.status(statusCode).json({
    status: "success",
    message,
    data,
  });
}

function errorResponse(res,message,errorCode = "COMMON_ERROR", statusCode = 400,) {
  return res.status(statusCode).json({
    status: "error",
    message,
    error_code: errorCode,
  });
}

function successPageResponse(res, message, data, page, limit, totalItems, statusCode = 200) {
  const totalPages = Math.ceil(totalItems / limit);
  return res.status(statusCode).json({
    status: "success",
    message,
    pagination: {
      total_items: totalItems,
      total_pages: totalPages,
      current_page: Number(page),
      limit: Number(limit),
    },
    data,
  });
}

module.exports = {
  successResponse,
  errorResponse,
  successPageResponse,
};
