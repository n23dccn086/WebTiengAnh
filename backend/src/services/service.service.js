const ServiceModel = require('../models/service.model');

const getAllServices = async () => {
  return await ServiceModel.getAllServices();
};

module.exports = {
  getAllServices,
};