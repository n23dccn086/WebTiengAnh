const express = require('express');
const adminController = require('../../controllers/admin.controller');
const { protect, authorize } = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const adminValidation = require('../../validations/admin.validation');
const { uploadExcel } = require('../../config/multer');

// ==========================================
// NHÁNH 1: ADMIN ROUTER
// ==========================================
const adminRouter = express.Router();

adminRouter.use(protect);
adminRouter.use(authorize('ADMIN', 'SUPER_ADMIN'));

// User management
adminRouter.get('/users', adminController.getUsers);
adminRouter.patch('/users/:id/status', validate(adminValidation.changeUserStatusSchema), adminController.changeUserStatus);
adminRouter.patch('/users/:id/role', validate(adminValidation.changeUserRoleSchema), adminController.changeUserRole);

// Service management
adminRouter.get('/services', adminController.getServices);  // <-- THÊM DÒNG NÀY
adminRouter.post('/services', validate(adminValidation.serviceSchema), adminController.createService);
adminRouter.put('/services/:id', validate(adminValidation.serviceSchema), adminController.updateService);
adminRouter.patch('/services/:id/status', adminController.updateServiceStatus);
adminRouter.delete('/services/:id', adminController.deleteService);

// System flashcard sets
adminRouter.post('/system-sets', validate(adminValidation.createSystemFlashcardSetSchema), adminController.createSystemFlashcardSet);
adminRouter.post('/system-sets/import', uploadExcel.single('file'), adminController.importSystemFlashcardSet);

// Transactions
adminRouter.get('/transactions', adminController.getTransactions);

// ==========================================
// NHÁNH 2: SUPER ADMIN ROUTER
// ==========================================
const superAdminRouter = express.Router();

superAdminRouter.use(protect);
superAdminRouter.use(authorize('SUPER_ADMIN'));

superAdminRouter.post('/staff', validate(adminValidation.createStaffSchema), adminController.createStaff);
superAdminRouter.delete('/staff/:id', adminController.deleteStaff);
superAdminRouter.put('/staff/:id/password', validate(adminValidation.resetStaffPasswordSchema), adminController.resetStaffPassword);

module.exports = {
  adminRouter,
  superAdminRouter
};