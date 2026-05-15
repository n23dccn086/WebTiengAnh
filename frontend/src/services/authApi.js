import apiClient from './apiClient';

export const loginApi = async (email, password) => {
  const res = await apiClient.post('/auth/login', { email, password });
  return res.data;
};

export const registerApi = async (email, password, full_name) => {
  const res = await apiClient.post('/auth/register', { email, password, full_name });
  return res.data;
};

export const verifyEmailApi = async (token) => {
  const res = await apiClient.post('/auth/verify-email', { token });
  return res.data;
};

export const forgotPasswordApi = async (email) => {
  const res = await apiClient.post('/auth/forgot-password', { email });
  return res.data;
};

export const resetPasswordApi = async (token, new_password) => {
  const res = await apiClient.post('/auth/reset-password', { token, new_password });
  return res.data;
};