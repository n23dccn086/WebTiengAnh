import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  loginApi,
  registerApi,
  verifyEmailApi,
  forgotPasswordApi,
  resetPasswordApi,
} from "../services/authApi";

const clearAuthStorage = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
  localStorage.removeItem("auth-storage");
};

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      login: async (email, password) => {
        try {
          clearAuthStorage();

          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
          });

          const result = await loginApi(email, password);

          if (result.status === "success") {
            const { accessToken, user } = result.data;

            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("user", JSON.stringify(user));

            set({
              user,
              accessToken,
              isAuthenticated: true,
            });

            return {
              success: true,
              message: result.message || "Đăng nhập thành công.",
            };
          }

          clearAuthStorage();

          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
          });

          return {
            success: false,
            message: result.message || "Email hoặc mật khẩu không chính xác.",
          };
        } catch (error) {
          clearAuthStorage();

          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
          });

          return {
            success: false,
            message:
              error.response?.data?.message ||
              "Email hoặc mật khẩu không chính xác.",
          };
        }
      },

      register: async (email, password, full_name) => {
        try {
          const result = await registerApi(email, password, full_name);

          if (result.status === "success") {
            return { success: true, message: result.message };
          }

          return { success: false, message: result.message };
        } catch (error) {
          return {
            success: false,
            message: error.response?.data?.message || "Đăng ký thất bại",
          };
        }
      },

      verifyEmail: async (token) => {
        try {
          const result = await verifyEmailApi(token);

          if (result.status === "success") {
            return { success: true, message: result.message };
          }

          return { success: false, message: result.message };
        } catch (error) {
          return {
            success: false,
            message: error.response?.data?.message || "Xác thực thất bại",
          };
        }
      },

      forgotPassword: async (email) => {
        try {
          const result = await forgotPasswordApi(email);

          if (result.status === "success") {
            return { success: true, message: result.message };
          }

          return { success: false, message: result.message };
        } catch (error) {
          return {
            success: false,
            message: error.response?.data?.message || "Gửi yêu cầu thất bại",
          };
        }
      },

      resetPassword: async (token, new_password) => {
        try {
          const result = await resetPasswordApi(token, new_password);

          if (result.status === "success") {
            return { success: true, message: result.message };
          }

          return { success: false, message: result.message };
        } catch (error) {
          return {
            success: false,
            message:
              error.response?.data?.message || "Đặt lại mật khẩu thất bại",
          };
        }
      },

      logout: () => {
        clearAuthStorage();

        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

export default useAuthStore;
