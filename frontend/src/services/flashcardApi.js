import apiClient from './apiClient';

export const getFlashcardsByServiceApi = async (serviceId) => {
  try {
    const res = await apiClient.get(`/flashcards/service/${serviceId}`);
    return res.data.data || res.data;
  } catch {
    return [
      { id: 1, word: 'Dog', meaning: 'Con chó', pronunciation: 'dɒɡ', example_sentence: 'I have a dog.' },
      { id: 2, word: 'Cat', meaning: 'Con mèo', pronunciation: 'kæt', example_sentence: 'The cat is sleeping.' }
    ];
  }
};

export const addFlashcardToUserApi = async (flashcardId) => {
  try {
    await apiClient.post(`/flashcards/learn/${flashcardId}`);
    return true;
  } catch { return false; }
};

export const submitReviewApi = async (flashcardId, rating) => {
  console.log(`Review ${flashcardId} with ${rating}`);
  return true;
};