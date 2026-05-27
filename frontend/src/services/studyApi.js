import apiClient from './apiClient';

export const generatePractice = async (setId, numQuestions = 10) => {
  const res = await apiClient.post(`/study/${setId}/practice`, { num_questions: numQuestions });
  return res.data.data;
};

export const createTest = async (setId, numQuestions = 10) => {
  const res = await apiClient.post(`/study/${setId}/test`, { num_questions: numQuestions });
  return res.data.data;
};

export const autoSave = async (attemptId, answers) => {
  await apiClient.patch(`/study/tests/${attemptId}/auto-save`, { answers });
  return res.data.data;
};

export const submitTest = async (attemptId) => {
  const res = await apiClient.post(`/study/tests/${attemptId}/submit`);
  return res.data.data;
};