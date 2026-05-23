import apiClient from './apiClient';

export const getTodayReviews = async () => {
  const res = await apiClient.get('/srs/today');
  // Backend trả về: { status, message, data: { total_due, flashcards } }
  return res.data.data.flashcards || [];
};

export const submitReview = async (flashcardId, rating) => {
  const res = await apiClient.post('/srs/review', { flashcard_id: flashcardId, rating });
  return res.data;
};

export const startLearning = async (setId) => {
  const res = await apiClient.post('/srs/start', { set_id: setId });
  return res.data;
};

export const learnNewCards = async (setId, count = 20) => {
  const res = await apiClient.post('/srs/learn-new', { set_id: setId, count });
  return res.data;
};