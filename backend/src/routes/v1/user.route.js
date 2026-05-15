const express = require('express');
const router = express.Router();

const userController = require('../../controllers/user.controller');
const { protect } = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const { updateProfileSchema, changePasswordSchema } = require('../../validations/user.validation');

// Bắt buộc đăng nhập cho TẤT CẢ các route bên dưới
router.use(protect);

router.get('/profile', userController.getProfile);
router.put('/profile', validate(updateProfileSchema), userController.updateProfile);
router.put('/password', validate(changePasswordSchema), userController.changePassword);

module.exports = router;