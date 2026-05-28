import apiClient from './apiClient';

export const generatePractice = async (setId, numQuestions = 10) => {
  const res = await apiClient.post(`/study/${setId}/practice`, { num_questions: numQuestions });
  return res.data.data;
};

export const createTest = async (setId, numQuestions = 10, resumeAttemptId = null) => {
  const body = { num_questions: numQuestions };
  if (resumeAttemptId) body.resume_attempt_id = resumeAttemptId;
  const res = await apiClient.post(`/study/${setId}/test`, body);
  return res.data.data;
};

export const autoSave = async (attemptId, answers) => {
  // ✅ Đã khai báo const res
  const res = await apiClient.patch(`/study/tests/${attemptId}/auto-save`, { answers });
  return res.data;
};

export const submitTest = async (attemptId) => {
  const res = await apiClient.post(`/study/tests/${attemptId}/submit`);
  return res.data.data;
};

export const getTestHistory = async (setId) => {
  const res = await apiClient.get(`/study/tests/history/${setId}`);
  return res.data.data;
};