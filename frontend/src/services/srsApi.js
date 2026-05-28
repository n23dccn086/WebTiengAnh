import apiClient from './apiClient';

export const getTodayReviews = async () => {
  const res = await apiClient.get('/srs/today');
  // ✅ Backend trả về { status, message, data: [...] } (mảng trực tiếp)
  const flashcards = res.data?.data || [];
  console.log('[srsApi] getTodayReviews - số lượng:', flashcards.length);
  return flashcards;
};

export const submitReview = async (flashcardId, rating) => {
  const res = await apiClient.post('/srs/review', { flashcard_id: flashcardId, rating });
  return res.data;
};

export const startLearning = async (setId) => {
  const res = await apiClient.post('/srs/start', { set_id: setId });
  return res.data;
};

export const learnNewCards = async (count = 20) => {
  const res = await apiClient.post('/srs/learn-new', { limit: count });
  // Backend trả về { status, message, data: { added_count, flashcards } }
  return res.data.data || { added_count: 0, flashcards: [] };
};