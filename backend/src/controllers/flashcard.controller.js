const FlashcardService = require('../services/flashcard.service');
const DictionaryService = require('../services/dictionary.service');
const catchAsync = require('../utils/catchAsync');
const { successResponse } = require('../utils/response.helper');

const autoFill = catchAsync(async (req, res) => {
  const data = await DictionaryService.autoFillWord(req.body.word);
  return successResponse(res, "Lấy thông tin từ vựng thành công", data);
});

const addFlashcard = catchAsync(async (req, res) => {
  const { set_id, word, meaning, pronunciation, example_sentence, part_of_speech } = req.body;
  const newCard = await FlashcardService.addFlashcard(
    req.user.id, set_id, word, meaning, pronunciation, example_sentence, part_of_speech
  );
  return res.status(201).json({ status: "success", message: "Thêm từ vựng thành công", data: newCard });
});

const updateFlashcard = catchAsync(async (req, res) => {
  const { word, meaning, pronunciation, example_sentence, part_of_speech } = req.body;
  await FlashcardService.updateFlashcard(
    req.user.id, parseInt(req.params.id, 10), word, meaning, pronunciation, example_sentence, part_of_speech
  );
  return successResponse(res, "Cập nhật từ vựng thành công");
});

const deleteFlashcard = catchAsync(async (req, res) => {
  await FlashcardService.deleteFlashcard(req.user.id, parseInt(req.params.id, 10));
  return successResponse(res, "Xóa từ vựng thành công");
});

module.exports = { autoFill, addFlashcard, updateFlashcard, deleteFlashcard };