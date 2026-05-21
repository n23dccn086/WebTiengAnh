import apiClient from './apiClient';

export const getTodayReviews = async () => {
  const res = await apiClient.get('/srs/today');
  return res.data.data;
};

export const submitReview = async (flashcardId, rating) => {
  const res = await apiClient.post('/srs/review', { flashcard_id: flashcardId, rating });
  return res.data;
};

export const completeSession = async () => {
  const res = await apiClient.post('/srs/complete');
  return res.data;
};