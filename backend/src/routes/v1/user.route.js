const express = require('express');
const router = express.Router();

const userController = require('../../controllers/user.controller');
const { protect } = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const { updateProfileSchema, changePasswordSchema } = require('../../validations/user.validation');

router.use(protect);

router.get('/profile', userController.getProfile);
router.put('/profile', validate(updateProfileSchema), userController.updateProfile);
router.put('/password', validate(changePasswordSchema), userController.changePassword);
router.put('/reminder', userController.updateReminder); // ← THÊM DÒNG NÀY
router.get('/dashboard-stats', userController.getDashboardStats);

module.exports = router;