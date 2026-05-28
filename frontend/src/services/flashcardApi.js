import apiClient from './apiClient';

export const getFlashcardsBySetApi = async (setId) => {
  const res = await apiClient.get(`/flashcard-sets/${setId}`);
  return res.data.data.flashcards;
};

export const autoFillWord = async (word) => {
  const res = await apiClient.post('/dictionary/auto-fill', { word });
  return res.data.data;
};

export const addFlashcardToSet = async (setId, flashcardData) => {
  const res = await apiClient.post(`/flashcards`, { set_id: setId, ...flashcardData });
  return res.data.data;
};

export const updateFlashcard = async (id, data) => {
  await apiClient.put(`/flashcards/${id}`, data);
};

export const deleteFlashcard = async (id) => {
  await apiClient.delete(`/flashcards/${id}`);
};

export const getUserSets = async (page = 1, limit = 12) => {
  const res = await apiClient.get(`/flashcard-sets?page=${page}&limit=${limit}`);
  return res.data.data;
};

// Các hàm quản lý bộ thẻ khác (nếu cần)
export const getSetDetail = async (id) => {
  const res = await apiClient.get(`/flashcard-sets/${id}`);
  return res.data.data;
};

export const createSet = async (data) => {
  const res = await apiClient.post("/flashcard-sets", data);
  return res.data.data;
};

export const updateSet = async (id, data) => {
  await apiClient.put(`/flashcard-sets/${id}`, data);
};

export const deleteSet = async (id) => {
  await apiClient.delete(`/flashcard-sets/${id}`);
};

export const toggleSrs = async (id, is_srs_enabled, daily_new_words = 20) => {
  await apiClient.put(`/flashcard-sets/${id}/toggle-srs`, { is_srs_enabled, daily_new_words });
};

export const saveSystemSet = async (id) => {
  await apiClient.post(`/flashcard-sets/${id}/save`);
};

export const unsaveSystemSet = async (id) => {
  await apiClient.delete(`/flashcard-sets/${id}/save`);
};