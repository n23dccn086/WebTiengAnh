const express = require("express");
const { body, param } = require("express-validator");

const router = express.Router();

const { protect, authorize } = require("../../middlewares/auth.middleware");
const validate = require("../../middlewares/validate.middleware");
const Vocabulary = require("../../models/flashcard.model");

const {
  successResponse,
  errorResponse,
} = require("../../utils/response.helper");

// =========================
// LẤY TẤT CẢ FLASHCARD CÔNG KHAI
// GET /api/v1/vocab
// =========================
router.get("/", async (req, res) => {
  try {
    const flashcards = await Vocabulary.getAllFlashcards();

    return successResponse(
      res,
      "Lấy danh sách flashcard thành công.",
      flashcards,
      200,
    );
  } catch (error) {
    return errorResponse(
      res,
      "Lỗi server: " + error.message,
      "SERVER_ERROR",
      500,
    );
  }
});

// =========================
// LẤY FLASHCARD THEO SERVICE
// GET /api/v1/vocab/service/:serviceId
// =========================
router.get(
  "/service/:serviceId",
  [
    param("serviceId")
      .isInt({ min: 1 })
      .withMessage("serviceId phải là số nguyên dương"),
  ],
  validate,
  async (req, res) => {
    try {
      const serviceId = Number(req.params.serviceId);

      const flashcards = await Vocabulary.getFlashcardsByService(serviceId);

      return successResponse(
        res,
        "Lấy flashcard theo dịch vụ thành công.",
        flashcards,
        200,
      );
    } catch (error) {
      return errorResponse(
        res,
        "Lỗi server: " + error.message,
        "SERVER_ERROR",
        500,
      );
    }
  },
);

// =========================
// THÊM FLASHCARD HỆ THỐNG
// Chỉ ADMIN / SUPER_ADMIN
// POST /api/v1/vocab
// =========================
router.post(
  "/",
  protect,
  authorize("ADMIN", "SUPER_ADMIN"),
  [
    body("word").notEmpty().withMessage("Từ vựng không được để trống"),

    body("meaning").notEmpty().withMessage("Nghĩa của từ không được để trống"),

    body("service_id")
      .optional()
      .isInt({ min: 1 })
      .withMessage("service_id phải là số nguyên dương"),

    body("pronunciation")
      .optional()
      .isString()
      .withMessage("Phát âm không hợp lệ"),

    body("example_sentence")
      .optional()
      .isString()
      .withMessage("Câu ví dụ không hợp lệ"),

    body("part_of_speech")
      .optional()
      .isString()
      .withMessage("Từ loại không hợp lệ"),
  ],
  validate,
  async (req, res) => {
    try {
      const {
        service_id,
        word,
        meaning,
        pronunciation,
        example_sentence,
        part_of_speech,
      } = req.body;

      const newFlashcard = await Vocabulary.addFlashcard({
        service_id: service_id || null,
        created_by: req.user.id,
        word,
        meaning,
        pronunciation: pronunciation || null,
        example_sentence: example_sentence || null,
        part_of_speech: part_of_speech || null,
      });

      return successResponse(
        res,
        "Thêm flashcard thành công.",
        newFlashcard,
        201,
      );
    } catch (error) {
      return errorResponse(
        res,
        "Lỗi server: " + error.message,
        "SERVER_ERROR",
        500,
      );
    }
  },
);

// =========================
// XÓA FLASHCARD HỆ THỐNG
// Chỉ ADMIN / SUPER_ADMIN
// DELETE /api/v1/vocab/:id
// =========================
router.delete(
  "/:id",
  protect,
  authorize("ADMIN", "SUPER_ADMIN"),
  [
    param("id")
      .isInt({ min: 1 })
      .withMessage("id flashcard phải là số nguyên dương"),
  ],
  validate,
  async (req, res) => {
    try {
      const deleted = await Vocabulary.deleteFlashcard(Number(req.params.id));

      if (!deleted) {
        return errorResponse(
          res,
          "Không tìm thấy flashcard.",
          "FLASHCARD_NOT_FOUND",
          404,
        );
      }

      return successResponse(res, "Xóa flashcard thành công.", null, 200);
    } catch (error) {
      return errorResponse(
        res,
        "Lỗi server: " + error.message,
        "SERVER_ERROR",
        500,
      );
    }
  },
);

// =========================
// USER THÊM FLASHCARD VÀO DANH SÁCH HỌC
// USER / PREMIUM / ADMIN / SUPER_ADMIN
// POST /api/v1/vocab/learn/:flashcardId
// =========================
router.post(
  "/learn/:flashcardId",
  protect,
  authorize("USER", "PREMIUM", "ADMIN", "SUPER_ADMIN"),
  [
    param("flashcardId")
      .isInt({ min: 1 })
      .withMessage("flashcardId phải là số nguyên dương"),
  ],
  validate,
  async (req, res) => {
    try {
      const flashcardId = Number(req.params.flashcardId);

      await Vocabulary.addToUserFlashcards(req.user.id, flashcardId);

      return successResponse(
        res,
        "Đã thêm flashcard vào danh sách học.",
        null,
        200,
      );
    } catch (error) {
      return errorResponse(
        res,
        "Lỗi server: " + error.message,
        "SERVER_ERROR",
        500,
      );
    }
  },
);

module.exports = router;
