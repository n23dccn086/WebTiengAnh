const axios = require('axios');
const AppError = require('../utils/appError');

const autoFillWord = async (word) => {
  try {
    const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    const data = response.data[0];

    // Bóc tách dữ liệu thông minh, tránh lỗi undefined nếu API thiếu field
    const meaningObj = data.meanings[0];
    const definitionObj = meaningObj?.definitions[0];

    return {
      word: data.word,
      pronunciation: data.phonetic || data.phonetics?.find(p => p.text)?.text || null,
      part_of_speech: meaningObj?.partOfSpeech || null,
      meaning: definitionObj?.definition || null,
      example_sentence: definitionObj?.example || null,
    };
  } catch (error) {
    // Bắt êm lỗi 404 (Từ không tồn tại) -> Trả về null cho Frontend tự xử lý
    if (error.response && error.response.status === 404) {
      return null;
    }
    // Lỗi mạng hoặc lỗi server khác
    throw new AppError(500, 'Lỗi khi gọi API từ điển. Vui lòng nhập thủ công.', 'DICTIONARY_API_ERROR');
  }
};

module.exports = {
  autoFillWord,
};