const express = require('express');
const router = express.Router();
const serviceController = require('../../controllers/service.controller');

router.get('/', serviceController.getServices);

module.exports = router;