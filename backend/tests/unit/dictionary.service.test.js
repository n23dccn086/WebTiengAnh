// File: tests/unit/dictionary.service.test.js
const axios = require('axios');
const dictionaryService = require('../../src/services/dictionary.service');

// "Bắt cóc" thư viện axios, không cho nó gửi request thật ra ngoài internet
jest.mock('axios');

describe('Dictionary Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Nên trả về đầy đủ nghĩa tiếng Việt và ví dụ tiếng Anh khi tra từ thành công', async () => {
    // 1. Giả lập dữ liệu trả về từ API Tiếng Việt
    const mockViResponse = {
      data: {
        exists: true,
        results: [{
          meanings: [{ definition_lang: 'vi', definition: 'quả táo', pos: 'noun' }],
          pronunciations: [{ ipa: '/ˈæp.əl/' }]
        }]
      }
    };

    // 2. Giả lập dữ liệu trả về từ API Tiếng Anh
    const mockEnResponse = {
      data: [{
        word: 'apple',
        meanings: [{
          definitions: [{ example: 'I ate a red apple.' }]
        }]
      }]
    };

    // Khi axios.get được gọi lần 1 -> Trả API Việt. Lần 2 -> Trả API Anh
    axios.get
      .mockResolvedValueOnce(mockViResponse)
      .mockResolvedValueOnce(mockEnResponse);

    const result = await dictionaryService.lookupWord('apple');

    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(result.word).toBe('apple');
    expect(result.meaning).toBe('quả táo');
    expect(result.example_sentence).toBe('I ate a red apple.');
    expect(result.pronunciation).toBe('/ˈæp.əl/');
  });

  test('Nên trả về NULL và không sập server nếu API Tiếng Việt báo lỗi 404 (Từ không tồn tại)', async () => {
    // Giả lập axios quăng lỗi 404 Not Found
    const notFoundError = new Error('Not Found');
    notFoundError.response = { status: 404 };
    
    axios.get.mockRejectedValueOnce(notFoundError);

    const result = await dictionaryService.lookupWord('asdfghjkl');

    expect(result).toBeNull(); // Xử lý lỗi rất mượt, không sập app
  });
});