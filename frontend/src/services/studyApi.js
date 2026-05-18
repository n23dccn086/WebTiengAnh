import apiClient from './apiClient';

export const generatePractice = async (setId) => {
  const res = await apiClient.post(`/study/${setId}/practice`);
  return res.data.data;
};

export const createTest = async (setId) => {
  const res = await apiClient.post(`/study/${setId}/test`);
  return res.data.data;
};

export const autoSave = async (attemptId, answers) => {
  await apiClient.patch(`/tests/${attemptId}/auto-save`, { answers });
};

export const submitTest = async (attemptId) => {
  const res = await apiClient.post(`/tests/${attemptId}/submit`);
  return res.data.data;
};