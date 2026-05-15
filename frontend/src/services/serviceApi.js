import apiClient from './apiClient';

export const getServicesApi = async () => {
  try {
    const res = await apiClient.get('/services');
    return res.data.data || res.data;
  } catch {
    return [
      { id: 1, title: 'Basic Vocabulary', description: 'Từ vựng tiếng Anh cơ bản' },
      { id: 2, title: 'TOEIC', description: 'Luyện từ vựng và quiz TOEIC' },
      { id: 3, title: 'IELTS', description: 'Luyện từ vựng và quiz IELTS' },
      { id: 4, title: 'Grammar', description: 'Bài tập ngữ pháp tiếng Anh' }
    ];
  }
};