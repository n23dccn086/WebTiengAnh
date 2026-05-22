const ServiceService = require('../services/service.service');
const catchAsync = require('../utils/catchAsync');
const { successResponse } = require('../utils/response.helper');

const getServices = catchAsync(async (req, res) => {
  const services = await ServiceService.getAllServices();
  return successResponse(res, "Lấy danh sách danh mục thành công", services);
});

module.exports = { getServices };