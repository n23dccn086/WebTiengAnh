// src/services/dictionary.service.js

const axios = require('axios');
const AppError = require('../utils/appError');

const VI_API_URL = 'https://dict.minhqnd.com/api/v1/lookup';
const EN_API_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en';

const lookupWord = async (word) => {
  try {
    // 1. Gọi API lấy nghĩa tiếng Việt (kèm ví dụ tiếng Việt, nhưng ta sẽ bỏ qua example của nó)
    const viResponse = await axios.get(VI_API_URL, {
      params: { word, def_lang: 'vi' }
    });
    const viData = viResponse.data;

    let meaning = null;
    let pronunciation = null;
    let partOfSpeech = null;

    if (viData.exists && viData.results && viData.results.length > 0) {
      const firstResult = viData.results[0];
      const viMeaning = firstResult.meanings?.find(m => m.definition_lang === 'vi');
      if (viMeaning) {
        meaning = viMeaning.definition;
        partOfSpeech = viMeaning.pos || null;
      }
      pronunciation = firstResult.pronunciations?.[0]?.ipa || null;
    }

    // 2. Gọi API tiếng Anh để lấy câu ví dụ (example sentence) và từ gốc
    let exampleSentence = null;
    let englishWord = word;

    try {
      const enResponse = await axios.get(`${EN_API_URL}/${word}`);
      const enData = enResponse.data[0];
      englishWord = enData.word || word;
      const meaningObj = enData.meanings?.[0];
      const definitionObj = meaningObj?.definitions?.[0];
      if (definitionObj?.example) {
        exampleSentence = definitionObj.example;
      }
      // Nếu không có pronunciation từ API Việt, lấy từ API Anh
      if (!pronunciation) {
        pronunciation = enData.phonetic || enData.phonetics?.find(p => p.text)?.text || null;
      }
    } catch (enError) {
      // Không lấy được example từ API Anh (có thể từ không tồn tại trong API Anh), bỏ qua
      console.warn(`Could not fetch English example for "${word}":`, enError.message);
    }

    // Nếu không có nghĩa tiếng Việt, trả về null (frontend sẽ hiển thị form nhập tay)
    if (!meaning) return null;

    return {
      word: englishWord,
      pronunciation: pronunciation,
      part_of_speech: partOfSpeech,
      meaning: meaning,                // tiếng Việt
      example_sentence: exampleSentence, // tiếng Anh (hoặc null nếu không có)
    };
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return null;
    }
    console.error('Lỗi khi gọi API từ điển:', error.message);
    throw new AppError(500, 'Lỗi khi gọi API từ điển. Vui lòng nhập thủ công.', 'DICTIONARY_API_ERROR');
  }
};

module.exports = {
  lookupWord,
};