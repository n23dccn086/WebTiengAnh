import apiClient from './apiClient';

export const getTodayReviews = async () => {
  const res = await apiClient.get('/srs/today');
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

export const learnNewCards = async (count = 20) => {
  const res = await apiClient.post('/srs/learn-new', { limit: count });
  return res.data.data;
};