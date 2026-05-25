import apiClient from './apiClient';

export const createMomoPayment = async () => {
  const res = await apiClient.post('/payments/momo');
  return res.data.data; // { payUrl, transaction_ref }
};