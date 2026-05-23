const express = require('express');
const adminController = require('../../controllers/admin.controller');
const { protect, authorize } = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware'); // Thêm dòng này
const adminValidation = require('../../validations/admin.validation'); // Thêm dòng này

// ==========================================
// NHÁNH 1: ADMIN ROUTER
// ==========================================
const adminRouter = express.Router();

adminRouter.use(protect);
adminRouter.use(authorize('ADMIN', 'SUPER_ADMIN'));

adminRouter.get('/users', adminController.getUsers);

// Gắn validate vào các route PATCH, POST, PUT
adminRouter.patch('/users/:id/status', validate(adminValidation.changeUserStatusSchema), adminController.changeUserStatus);
adminRouter.patch('/users/:id/role', validate(adminValidation.changeUserRoleSchema), adminController.changeUserRole);

adminRouter.post('/services', validate(adminValidation.serviceSchema), adminController.createService);
adminRouter.put('/services/:id', validate(adminValidation.serviceSchema), adminController.updateService);
adminRouter.delete('/services/:id', adminController.deleteService);

adminRouter.post('/system-sets', validate(adminValidation.createSystemFlashcardSetSchema), adminController.createSystemFlashcardSet);
adminRouter.get('/transactions', adminController.getTransactions);

// ==========================================
// NHÁNH 2: SUPER ADMIN ROUTER
// ==========================================
const superAdminRouter = express.Router();

superAdminRouter.use(protect);
superAdminRouter.use(authorize('SUPER_ADMIN'));

// Gắn validate cho Staff
superAdminRouter.post('/staff', validate(adminValidation.createStaffSchema), adminController.createStaff);
superAdminRouter.delete('/staff/:id', adminController.deleteStaff);
superAdminRouter.put('/staff/:id/password', validate(adminValidation.resetStaffPasswordSchema), adminController.resetStaffPassword);

module.exports = {
  adminRouter,
  superAdminRouter
};