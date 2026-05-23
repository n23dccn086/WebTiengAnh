import apiClient from './apiClient';

// ✅ Đúng: lấy flashcards từ chi tiết bộ thẻ
export const getFlashcardsBySetApi = async (setId) => {
  const res = await apiClient.get(`/flashcard-sets/${setId}`);
  return res.data.data.flashcards; // mảng flashcards
};

// ✅ Tự động điền từ từ điển
export const autoFillWord = async (word) => {
  const res = await apiClient.post('/dictionary/auto-fill', { word });
  return res.data.data;
};

// ✅ Thêm flashcard thủ công vào bộ thẻ
export const addFlashcardToSet = async (setId, flashcardData) => {
  const res = await apiClient.post(`/flashcards`, { set_id: setId, ...flashcardData });
  return res.data.data;
};

// ✅ Cập nhật flashcard
export const updateFlashcard = async (id, data) => {
  await apiClient.put(`/flashcards/${id}`, data);
};

// ✅ Xoá flashcard
export const deleteFlashcard = async (id) => {
  await apiClient.delete(`/flashcards/${id}`);
};
