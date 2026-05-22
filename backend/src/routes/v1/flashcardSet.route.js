const express = require('express');
const router = express.Router();
const { protect } = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const flashcardSetController = require('../../controllers/flashcardSet.controller');
const { createSetSchema, updateSetSchema, toggleSrsSchema } = require('../../validations/flashcardSet.validation');

router.use(protect);

router.get('/', flashcardSetController.getUserSets);
router.get('/system', flashcardSetController.getSystemSets);
router.post('/', validate(createSetSchema), flashcardSetController.createSet);
router.get('/:id', flashcardSetController.getSetDetail);
router.put('/:id', validate(updateSetSchema), flashcardSetController.updateSet);
router.delete('/:id', flashcardSetController.deleteSet);

router.put('/:id/toggle-srs', validate(toggleSrsSchema), flashcardSetController.toggleSrs);
router.post('/:id/save', flashcardSetController.saveSystemSet);
router.delete('/:id/save', flashcardSetController.unsaveSystemSet);

module.exports = router;