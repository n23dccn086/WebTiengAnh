const axios = require('axios');

/**
 * Gọi Free Dictionary API để lấy thông tin từ vựng
 * @param {string} word - Từ tiếng Anh cần tra
 * @returns {Promise<Object|null>} - Trả về object nghĩa, phiên âm, ví dụ, loại từ hoặc null nếu không tìm thấy
 */
async function lookupWord(word) {
  try {
    const response = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    const data = response.data[0];
    if (!data) return null;

    const meaning = data.meanings[0];
    const definition = meaning.definitions[0];
    return {
      word: data.word,
      meaning: definition.definition,
      pronunciation: data.phonetic || '',
      example_sentence: definition.example || '',
      part_of_speech: meaning.partOfSpeech || '',
    };
  } catch (error) {
    console.error(`Dictionary lookup failed for "${word}":`, error.message);
    return null;
  }
}

module.exports = { lookupWord };