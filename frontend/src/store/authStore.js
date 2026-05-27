import { create } from "zustand";
import { persist } from "zustand/middleware";
import apiClient from "../services/apiClient";
import {
  loginApi,
  registerApi,
  verifyEmailApi,
  forgotPasswordApi,
  resetPasswordApi,
} from "../services/authApi";

const clearAuthStorage = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  localStorage.removeItem("auth-storage");
};

const getLoginData = (result) => {
  const data = result?.data || {};
  return {
    accessToken: data.accessToken || data.token || null,
    refreshToken: data.refreshToken || null,
    user: data.user || null,
  };
};

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      login: async (email, password) => {
        try {
          clearAuthStorage();
          set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
          const result = await loginApi(email, password);
          if (result.status !== "success") {
            return { success: false, message: result.message || "Email hoặc mật khẩu không chính xác." };
          }
          const { accessToken, refreshToken, user } = getLoginData(result);
          if (!accessToken || !user) {
            clearAuthStorage();
            set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
            return { success: false, message: "Dữ liệu đăng nhập không hợp lệ." };
          }
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("user", JSON.stringify(user));
          if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
          set({ user, accessToken, refreshToken, isAuthenticated: true });
          return { success: true, message: result.message || "Đăng nhập thành công." };
        } catch (error) {
          clearAuthStorage();
          set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
          return { success: false, message: error.response?.data?.message || "Email hoặc mật khẩu không chính xác." };
        }
      },

      register: async (email, password, full_name) => {
        try {
          const result = await registerApi(email, password, full_name);
          if (result.status === "success") {
            return { success: true, message: result.message || "Đăng ký thành công." };
          }
          return { success: false, message: result.message || "Đăng ký thất bại." };
        } catch (error) {
          return { success: false, message: error.response?.data?.message || "Đăng ký thất bại." };
        }
      },

      verifyEmail: async (token) => {
        try {
          const result = await verifyEmailApi(token);
          if (result.status === "success") {
            return { success: true, message: result.message || "Xác thực thành công." };
          }
          return { success: false, message: result.message || "Xác thực thất bại." };
        } catch (error) {
          return { success: false, message: error.response?.data?.message || "Xác thực thất bại." };
        }
      },

      forgotPassword: async (email) => {
        try {
          const result = await forgotPasswordApi(email);
          if (result.status === "success") {
            return { success: true, message: result.message || "Đã gửi yêu cầu đặt lại mật khẩu." };
          }
          return { success: false, message: result.message || "Gửi yêu cầu thất bại." };
        } catch (error) {
          return { success: false, message: error.response?.data?.message || "Gửi yêu cầu thất bại." };
        }
      },

      resetPassword: async (token, new_password) => {
        try {
          const result = await resetPasswordApi(token, new_password);
          if (result.status === "success") {
            return { success: true, message: result.message || "Đặt lại mật khẩu thành công." };
          }
          return { success: false, message: result.message || "Đặt lại mật khẩu thất bại." };
        } catch (error) {
          return { success: false, message: error.response?.data?.message || "Đặt lại mật khẩu thất bại." };
        }
      },

      fetchProfile: async () => {
        try {
          const res = await apiClient.get('/users/profile');
          const userData = res.data.data;
          set({ user: userData, isAuthenticated: true });
          localStorage.setItem('user', JSON.stringify(userData));
          return { success: true };
        } catch (error) {
          return { success: false, message: error.response?.data?.message };
        }
      },

      updateProfile: async (data) => {
        try {
          const res = await apiClient.put('/users/profile', data);
          set((state) => ({ user: { ...state.user, ...res.data.data } }));
          localStorage.setItem('user', JSON.stringify({ ...get().user, ...res.data.data }));
          return { success: true, message: res.data.message };
        } catch (error) {
          return { success: false, message: error.response?.data?.message };
        }
      },

      changePassword: async (old_password, new_password) => {
        try {
          await apiClient.put('/users/password', { old_password, new_password });
          return { success: true, message: 'Đổi mật khẩu thành công' };
        } catch (error) {
          return { success: false, message: error.response?.data?.message };
        }
      },

      updateReminder: async (isEnabled) => {
        try {
          const res = await apiClient.put('/users/reminder', { is_enabled: isEnabled });
          set((state) => ({ user: { ...state.user, is_reminder_enabled: isEnabled } }));
          localStorage.setItem('user', JSON.stringify({ ...get().user, is_reminder_enabled: isEnabled }));
          return { success: true, message: res.data.message };
        } catch (error) {
          return { success: false, message: error.response?.data?.message };
        }
      },

      logout: () => {
        clearAuthStorage();
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;