import apiClient from "./apiClient";

export const getUserSets = async () => {
  const res = await apiClient.get("/flashcard-sets");
  return res.data.data;
};

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