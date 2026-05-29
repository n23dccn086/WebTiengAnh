const express = require("express");
const adminController = require("../../controllers/admin.controller");
const { protect, authorize } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");
const adminValidation = require("../../validations/admin.validation");
const { uploadExcel } = require("../../config/multer");

const adminRouter = express.Router();
adminRouter.use(protect);
adminRouter.use(authorize("ADMIN", "SUPER_ADMIN"));

adminRouter.get("/users", adminController.getUsers);
adminRouter.patch(
  "/users/:id/status",
  validate(adminValidation.changeUserStatusSchema),
  adminController.changeUserStatus,
);
adminRouter.patch(
  "/users/:id/role",
  validate(adminValidation.changeUserRoleSchema),
  adminController.changeUserRole,
);

adminRouter.get("/services", adminController.getServices);
adminRouter.post(
  "/services",
  validate(adminValidation.serviceSchema),
  adminController.createService,
);
adminRouter.put(
  "/services/:id",
  validate(adminValidation.serviceSchema),
  adminController.updateService,
);
adminRouter.patch("/services/:id/status", adminController.updateServiceStatus);
adminRouter.delete("/services/:id", adminController.deleteService);

adminRouter.post(
  "/system-sets",
  validate(adminValidation.createSystemFlashcardSetSchema),
  adminController.createSystemFlashcardSet,
);
adminRouter.post(
  "/system-sets/import",
  uploadExcel.single("file"),
  adminController.importSystemFlashcardSet,
);
adminRouter.get("/system-sets", adminController.getSystemSets);
adminRouter.put("/system-sets/:id", adminController.updateSystemSet);
adminRouter.delete("/system-sets/:id", adminController.deleteSystemSet);

adminRouter.get("/transactions", adminController.getTransactions);
adminRouter.get("/services/:id/sets", adminController.getSetsByService);

const superAdminRouter = express.Router();
superAdminRouter.use(protect);
superAdminRouter.use(authorize("SUPER_ADMIN"));

superAdminRouter.post(
  "/staff",
  validate(adminValidation.createStaffSchema),
  adminController.createStaff,
);
superAdminRouter.delete("/staff/:id", adminController.deleteStaff);
superAdminRouter.put(
  "/staff/:id/password",
  validate(adminValidation.resetStaffPasswordSchema),
  adminController.resetStaffPassword,
);

module.exports = {
  adminRouter,
  superAdminRouter,
};
