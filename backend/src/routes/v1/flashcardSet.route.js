const express = require('express');
const router = express.Router();
const { protect } = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const flashcardSetController = require('../../controllers/flashcardSet.controller');
const { createSetSchema, updateSetSchema, toggleSrsSchema } = require('../../validations/flashcardSet.validation');

// Import cấu hình Multer để hứng file PDF (Sprint 3)
const upload = require('../../config/multer');

router.use(protect);

// =====================================
// NHÓM API: THAO TÁC VỚI BỘ THẺ (SETS)
// =====================================

// Lấy danh sách
router.get('/', flashcardSetController.getUserSets);
router.get('/system', flashcardSetController.getSystemSets);

// [SPRINT 3 - MỚI] Tạo bộ thẻ từ PDF 
// (Lưu ý: Phải đặt dòng này TRƯỚC dòng /:id để tránh Express hiểu nhầm chữ 'pdf-extract' là 1 cái ID)
router.post('/pdf-extract', upload.single('file'), flashcardSetController.createSetFromPdf);

// Tạo bộ thẻ thủ công (Sprint 2)
router.post('/', validate(createSetSchema), flashcardSetController.createSet);

// Chi tiết, Sửa, Xóa
router.get('/:id', flashcardSetController.getSetDetail);
router.put('/:id', validate(updateSetSchema), flashcardSetController.updateSet);
router.delete('/:id', flashcardSetController.deleteSet);

// Các thao tác cài đặt SRS và Lưu bộ hệ thống
router.put('/:id/toggle-srs', validate(toggleSrsSchema), flashcardSetController.toggleSrs);
router.post('/:id/save', flashcardSetController.saveSystemSet);
router.delete('/:id/save', flashcardSetController.unsaveSystemSet);

module.exports = router;