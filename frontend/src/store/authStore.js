import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { loginApi, registerApi, verifyEmailApi, forgotPasswordApi, resetPasswordApi } from '../services/authApi';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      login: async (email, password) => {
        try {
          const result = await loginApi(email, password);
          if (result.status === 'success') {
            const { accessToken, user } = result.data;
            localStorage.setItem('accessToken', accessToken);
            set({ user, accessToken, isAuthenticated: true });
            return { success: true };
          }
          return { success: false, message: result.message };
        } catch (error) {
          const msg = error.response?.data?.message || 'Đăng nhập thất bại';
          return { success: false, message: msg };
        }
      },

      register: async (email, password, full_name) => {
        try {
          const result = await registerApi(email, password, full_name);
          if (result.status === 'success') {
            return { success: true, message: result.message };
          }
          return { success: false, message: result.message };
        } catch (error) {
          const msg = error.response?.data?.message || 'Đăng ký thất bại';
          return { success: false, message: msg };
        }
      },

      verifyEmail: async (token) => {
        try {
          const result = await verifyEmailApi(token);
          if (result.status === 'success') {
            return { success: true, message: result.message };
          }
          return { success: false, message: result.message };
        } catch (error) {
          const msg = error.response?.data?.message || 'Xác thực thất bại';
          return { success: false, message: msg };
        }
      },

      forgotPassword: async (email) => {
        try {
          const result = await forgotPasswordApi(email);
          if (result.status === 'success') {
            return { success: true, message: result.message };
          }
          return { success: false, message: result.message };
        } catch (error) {
          const msg = error.response?.data?.message || 'Gửi yêu cầu thất bại';
          return { success: false, message: msg };
        }
      },

      resetPassword: async (token, new_password) => {
        try {
          const result = await resetPasswordApi(token, new_password);
          if (result.status === 'success') {
            return { success: true, message: result.message };
          }
          return { success: false, message: result.message };
        } catch (error) {
          const msg = error.response?.data?.message || 'Đặt lại mật khẩu thất bại';
          return { success: false, message: msg };
        }
      },

      logout: () => {
        localStorage.removeItem('accessToken');
        set({ user: null, accessToken: null, isAuthenticated: false });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

export default useAuthStore;