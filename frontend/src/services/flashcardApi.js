import apiClient from './apiClient';

// Lấy flashcards theo service (cũ, giữ để không break)
export const getFlashcardsByServiceApi = async (serviceId) => {
  try {
    const res = await apiClient.get(`/flashcards/service/${serviceId}`);
    return res.data.data || res.data;
  } catch {
    // fallback mock data
    return [
      { id: 1, word: 'Dog', meaning: 'Con chó', pronunciation: 'dɒɡ', example_sentence: 'I have a dog.' },
      { id: 2, word: 'Cat', meaning: 'Con mèo', pronunciation: 'kæt', example_sentence: 'The cat is sleeping.' }
    ];
  }
};

// Thêm flashcard vào danh sách học của user (user_flashcards)
export const addFlashcardToUserApi = async (flashcardId) => {
  try {
    await apiClient.post(`/flashcards/learn/${flashcardId}`);
    return true;
  } catch { return false; }
};

// Gửi đánh giá SRS
export const submitReviewApi = async (flashcardId, rating) => {
  try {
    // Giả sử endpoint SRS là /srs/review
    await apiClient.post('/srs/review', { flashcard_id: flashcardId, rating });
    return true;
  } catch (error) {
    console.error('submitReviewApi error:', error);
    return false;
  }
};

// Lấy flashcards theo set_id (dùng cho SetDetail, FlashcardStudy)
export const getFlashcardsBySetApi = async (setId) => {
  const res = await apiClient.get(`/flashcards/set/${setId}`);
  return res.data.data;
};

// Lấy chi tiết flashcard
export const getFlashcardByIdApi = async (id) => {
  const res = await apiClient.get(`/flashcards/${id}`);
  return res.data.data;
};

// ========== CÁC HÀM MỚI CHO CỤM 1 ==========
// Tự động điền thông tin từ vựng qua Dictionary API
export const autoFillWord = async (word) => {
  const res = await apiClient.post('/dictionary/auto-fill', { word });
  return res.data.data;
};

// Thêm flashcard trực tiếp vào bộ thẻ (set_id)
export const addFlashcardToSet = async (setId, flashcardData) => {
  const res = await apiClient.post(`/flashcard-sets/${setId}/flashcards`, flashcardData);
  return res.data.data;
};