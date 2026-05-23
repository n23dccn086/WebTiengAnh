const express = require('express');
const router = express.Router();
const { protect } = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const flashcardController = require('../../controllers/flashcard.controller');
const { autoFillSchema, flashcardSchema, updateFlashcardSchema } = require('../../validations/flashcard.validation');

router.use(protect);

router.post('/auto-fill', validate(autoFillSchema), flashcardController.lookupWord);
router.post('/', validate(flashcardSchema), flashcardController.addFlashcard);
router.put('/:id', validate(updateFlashcardSchema), flashcardController.updateFlashcard);
router.delete('/:id', flashcardController.deleteFlashcard);

module.exports = router;