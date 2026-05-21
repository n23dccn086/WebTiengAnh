const flashcardSetModel = require("../models/flashcardSet.model");
const flashcardModel = require("../models/flashcard.model");
const { successResponse } = require("../utils/response.helper");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const parsePositiveInt = (value, fieldName) => {
  const number = Number.parseInt(value, 10);

  if (!Number.isInteger(number) || number <= 0) {
    throw new AppError(400, `${fieldName} không hợp lệ`, "INVALID_ID");
  }

  return number;
};

exports.getUserSets = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    service_id = null,
    serviceId = null,
  } = req.query;

  const data = await flashcardSetModel.getSetsByUser(req.user.id, {
    page,
    limit,
    service_id,
    serviceId,
  });

  return successResponse(
    res,
    "Lấy danh sách bộ thẻ thành công",
    data.sets,
    200,
    {
      total: data.total,
      page: Number.parseInt(page, 10) || 1,
      limit: Number.parseInt(limit, 10) || 20,
      service_id: service_id || serviceId || null,
    },
  );
});

exports.getSetDetail = catchAsync(async (req, res) => {
  const setId = parsePositiveInt(req.params.id, "setId");

  const set = await flashcardSetModel.getSetById(setId, req.user.id);

  if (!set) {
    throw new AppError(
      404,
      "Bộ thẻ không tồn tại hoặc không thuộc quyền sở hữu",
      "SET_NOT_FOUND",
    );
  }

  const flashcards = await flashcardModel.getFlashcardsBySet(setId);

  set.flashcards = flashcards;

  return successResponse(res, "Lấy chi tiết bộ thẻ thành công", set);
});

exports.createSet = catchAsync(async (req, res) => {
  const { service_id, title, description, document_id } = req.body;

  if (!service_id) {
    throw new AppError(400, "Thiếu service_id", "MISSING_SERVICE_ID");
  }

  if (!title || title.trim().length < 3) {
    throw new AppError(
      400,
      "Tên bộ thẻ phải có ít nhất 3 ký tự",
      "INVALID_TITLE",
    );
  }

  const newSet = await flashcardSetModel.createSet({
    user_id: req.user.id,
    service_id: Number(service_id),
    title: title.trim(),
    description: description?.trim() || null,
    document_id: document_id || null,
    is_system: false,
  });

  return successResponse(res, "Tạo bộ thẻ thành công", newSet, 201);
});

exports.updateSet = catchAsync(async (req, res) => {
  const setId = parsePositiveInt(req.params.id, "setId");
  const { title, description } = req.body;

  const set = await flashcardSetModel.getSetById(setId, req.user.id);

  if (!set) {
    throw new AppError(
      404,
      "Bộ thẻ không tồn tại hoặc không thuộc quyền sở hữu",
      "SET_NOT_FOUND",
    );
  }

  if (set.is_system) {
    throw new AppError(
      403,
      "Không được chỉnh sửa bộ thẻ hệ thống",
      "CANNOT_UPDATE_SYSTEM_SET",
    );
  }

  if (title !== undefined && title.trim().length < 3) {
    throw new AppError(
      400,
      "Tên bộ thẻ phải có ít nhất 3 ký tự",
      "INVALID_TITLE",
    );
  }

  const updated = await flashcardSetModel.updateSet(setId, {
    title: title?.trim(),
    description: description?.trim() || null,
  });

  if (!updated) {
    throw new AppError(400, "Cập nhật thất bại", "UPDATE_FAILED");
  }

  return successResponse(res, "Cập nhật bộ thẻ thành công");
});

exports.deleteSet = catchAsync(async (req, res) => {
  const setId = parsePositiveInt(req.params.id, "setId");

  const deleted = await flashcardSetModel.deleteSet(setId, req.user.id);

  if (!deleted) {
    throw new AppError(
      404,
      "Không tìm thấy bộ thẻ hoặc không thể xóa bộ thẻ hệ thống",
      "DELETE_FAILED",
    );
  }

  return successResponse(res, "Xóa bộ thẻ thành công");
});

exports.toggleSrs = catchAsync(async (req, res) => {
  const setId = parsePositiveInt(req.params.id, "setId");
  const { is_srs_enabled, daily_new_words = 20 } = req.body;

  const set = await flashcardSetModel.getSetById(setId, req.user.id);

  if (!set) {
    throw new AppError(
      404,
      "Bộ thẻ không tồn tại hoặc không thuộc quyền sở hữu",
      "SET_NOT_FOUND",
    );
  }

  await flashcardSetModel.toggleSrs(
    req.user.id,
    setId,
    Boolean(is_srs_enabled),
    Number.parseInt(daily_new_words, 10) || 20,
  );

  return successResponse(
    res,
    `Đã ${is_srs_enabled ? "bật" : "tắt"} chế độ SRS`,
  );
});

exports.getSetSettings = catchAsync(async (req, res) => {
  const setId = parsePositiveInt(req.params.id, "setId");

  const set = await flashcardSetModel.getSetById(setId, req.user.id);

  if (!set) {
    throw new AppError(
      404,
      "Bộ thẻ không tồn tại hoặc không thuộc quyền sở hữu",
      "SET_NOT_FOUND",
    );
  }

  const settings = await flashcardSetModel.getSetSettings(req.user.id, setId);

  return successResponse(res, "Lấy cài đặt SRS thành công", settings);
});

exports.addFlashcardToSet = catchAsync(async (req, res) => {
  const setId = parsePositiveInt(req.params.id, "setId");

  const { word, meaning, pronunciation, example_sentence, part_of_speech } =
    req.body;

  if (!word || !meaning) {
    throw new AppError(400, "Thiếu word hoặc meaning", "MISSING_FIELDS");
  }

  const set = await flashcardSetModel.getSetById(setId, req.user.id);

  if (!set) {
    throw new AppError(
      404,
      "Bộ thẻ không tồn tại hoặc không thuộc quyền sở hữu",
      "SET_NOT_FOUND",
    );
  }

  if (set.is_system) {
    throw new AppError(
      403,
      "Không được thêm flashcard vào bộ thẻ hệ thống",
      "CANNOT_UPDATE_SYSTEM_SET",
    );
  }

  const existingFlashcard = await flashcardModel.findFlashcardBySetAndWord(
    setId,
    word.trim(),
  );

  if (existingFlashcard) {
    throw new AppError(
      409,
      "Từ này đã tồn tại trong bộ thẻ",
      "FLASHCARD_ALREADY_EXISTS",
    );
  }

  const newFlashcard = await flashcardModel.addFlashcard({
    set_id: setId,
    word: word.trim(),
    meaning: meaning.trim(),
    pronunciation: pronunciation?.trim() || null,
    example_sentence: example_sentence?.trim() || null,
    part_of_speech: part_of_speech?.trim() || null,
  });

  return successResponse(res, "Thêm flashcard thành công", newFlashcard, 201);
});
