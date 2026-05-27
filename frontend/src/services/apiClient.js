import axios from "axios";
import useAuthStore from "../store/authStore";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
  headers: { "Content-Type": "application/json" },
});

// Request interceptor: gắn access token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: xử lý token hết hạn, nhưng không can thiệp vào lỗi 429
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // ✅ Nếu là request login thì không xử lý gì cả
    if (originalRequest.url?.includes('/auth/login')) {
      return Promise.reject(error);
    }

    // ✅ Xử lý refresh token cho lỗi 401 (hết hạn access token)
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refreshToken");

      if (refreshToken) {
        try {
          const res = await axios.post(
            `${import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"}/auth/refresh-token`,
            { refresh_token: refreshToken }
          );
          const newAccessToken = res.data.data.accessToken;
          localStorage.setItem("accessToken", newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          // Refresh token hết hạn hoặc không hợp lệ → logout
          useAuthStore.getState().logout();
          window.location.href = "/login";
          return Promise.reject(refreshError);
        }
      } else {
        useAuthStore.getState().logout();
        window.location.href = "/login";
      }
    }

    // ✅ Xử lý lỗi 403 (bị cấm) → logout
    if (status === 403) {
      useAuthStore.getState().logout();
      window.location.href = "/login";
    }

    // ✅ CÁC LỖI KHÁC (400, 404, 429, 500,...) KHÔNG LOGOUT, chỉ reject để component xử lý
    return Promise.reject(error);
  }
);

export default apiClient;