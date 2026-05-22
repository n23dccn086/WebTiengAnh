// src/services/dictionary.service.js

const axios = require('axios');
const AppError = require('../utils/appError');

// Đổi tên hàm từ autoFillWord thành lookupWord
const lookupWord = async (word) => {
  try {
    const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
    const data = response.data[0];

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
    if (error.response && error.response.status === 404) {
      return null;
    }
    throw new AppError(500, 'Lỗi khi gọi API từ điển. Vui lòng nhập thủ công.', 'DICTIONARY_API_ERROR');
  }
};

// Export đúng cái tên lookupWord
module.exports = {
  lookupWord,
};