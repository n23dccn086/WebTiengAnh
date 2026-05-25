import apiClient from './apiClient';

export const getPremiumDashboard = async () => {
  const res = await apiClient.get('/statistics/dashboard');
  return res.data.data;
};