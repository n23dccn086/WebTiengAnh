import apiClient from "./apiClient";

export const generatePractice = async (setId, numQuestions = 10) => {
  const res = await apiClient.post(`/study/${setId}/practice`, {
    num_questions: numQuestions,
  });

  return res.data?.data;
};

// Hỗ trợ cả 2 kiểu gọi:
// createTest(setId, 10, resumeAttemptId)
// createTest(setId, { num_questions: 10, force_new: false, resume_attempt_id: 35 })
export const createTest = async (
  setId,
  payloadOrNumQuestions = 10,
  resumeAttemptId = null,
) => {
  let body;

  if (
    typeof payloadOrNumQuestions === "object" &&
    payloadOrNumQuestions !== null
  ) {
    body = {
      num_questions: 10,
      ...payloadOrNumQuestions,
    };
  } else {
    body = {
      num_questions: payloadOrNumQuestions || 10,
    };

    if (resumeAttemptId) {
      body.resume_attempt_id = resumeAttemptId;
    }
  }

  const res = await apiClient.post(`/study/${setId}/test`, body);
  return res.data?.data;
};

// Route autosave hiện tại của bạn đang là /study/tests/:attemptId/auto-save
export const saveProgress = async (attemptId, answers) => {
  const res = await apiClient.patch(`/study/tests/${attemptId}/auto-save`, {
    answers,
  });

  return res.data?.data;
};

// Giữ alias autoSave để các file cũ đang import autoSave không bị lỗi
export const autoSave = saveProgress;

export const submitTest = async (attemptId) => {
  const res = await apiClient.post(`/study/tests/${attemptId}/submit`);
  return res.data?.data;
};

export const getTestHistory = async (setId) => {
  const res = await apiClient.get(`/study/tests/history/${setId}`);
  return res.data?.data;
};

export const getTestDetail = async (attemptId) => {
  const res = await apiClient.get(`/study/tests/${attemptId}`);
  return res.data?.data;
};

export const deleteTestAttempt = async (attemptId) => {
  const res = await apiClient.delete(`/study/tests/${attemptId}`);
  return res.data?.data;
};
