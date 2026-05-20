const express = require("express");
const router = express.Router();
const { protect } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");
const flashcardSetController = require("../../controllers/flashcardSet.controller");
const { 
  createSetSchema, 
  updateSetSchema, 
  toggleSrsSchema,
  createFlashcardSchema   // thêm validation cho flashcard
} = require("../../validations/flashcardSet.validation");

router.use(protect);

router.get("/", flashcardSetController.getUserSets);
router.post("/", validate(createSetSchema), flashcardSetController.createSet);
router.get("/:id", flashcardSetController.getSetDetail);
router.put("/:id", validate(updateSetSchema), flashcardSetController.updateSet);
router.delete("/:id", flashcardSetController.deleteSet);
router.put("/:id/toggle-srs", validate(toggleSrsSchema), flashcardSetController.toggleSrs);
router.get("/:id/settings", flashcardSetController.getSetSettings);

// Route mới: thêm flashcard vào bộ thẻ
router.post("/:id/flashcards", validate(createFlashcardSchema), flashcardSetController.addFlashcardToSet);

module.exports = router;