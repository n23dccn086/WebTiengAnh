import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { loginApi } from '../services/apiClient';

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
            set({
              user,
              accessToken,
              isAuthenticated: true
            });
            return { success: true };
          }
          return { success: false, message: result.message };
        } catch (error) {
          const msg = error.response?.data?.message || 'Đăng nhập thất bại';
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