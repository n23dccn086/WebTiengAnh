const flashcardService = require('../../src/services/flashcard.service');
const FlashcardSetModel = require('../../src/models/flashcardSet.model');
const FlashcardModel = require('../../src/models/flashcard.model');

// Mock 2 cái Models liên quan
jest.mock('../../src/models/flashcardSet.model');
jest.mock('../../src/models/flashcard.model');

describe('Flashcard Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('TC-06: Thêm từ đã tồn tại trong bộ thẻ sẽ văng lỗi HTTP 409', async () => {
    const userId = 1;
    const userRole = 'USER';
    const setId = 1;
    const newWord = "Apple";

    // 1. Cấp quyền chủ sở hữu để không bị văng lỗi 403
    FlashcardSetModel.getSetById.mockResolvedValueOnce({
      id: setId,
      is_system: false,
      user_id: userId // Khớp với userId truyền vào
    });

    // 2. Bật còi báo động: Từ này đã có trong DB
    FlashcardModel.checkDuplicateWord.mockResolvedValueOnce({ id: 10, word: "Apple" });

    // Gọi hàm với ĐỦ các tham số như code bạn viết
    await expect(flashcardService.addFlashcard(userId, userRole, setId, newWord, "Quả táo", null, null, null))
      .rejects
      .toMatchObject({
        statusCode: 409,
        message: `Từ '${newWord}' đã tồn tại trong bộ thẻ này.` // Có dấu chấm ở cuối theo đúng code bạn
      });
  });
});