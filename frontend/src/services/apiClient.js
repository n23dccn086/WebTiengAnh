import axios from "axios";
import useAuthStore from "../store/authStore";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
  headers: { "Content-Type": "application/json" },
});

// Request interceptor: gắn token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: xử lý 401, refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const errorCode = error.response?.data?.error_code;

    // Không xử lý nếu là request login/refresh
    if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh-token')) {
      return Promise.reject(error);
    }

    // Nếu 401 và chưa thử refresh
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
          // Refresh token hết hạn -> logout
          useAuthStore.getState().logout();
          window.location.href = "/login";
          return Promise.reject(refreshError);
        }
      } else {
        useAuthStore.getState().logout();
        window.location.href = "/login";
      }
    }

    // Không logout với lỗi 403 do quota (QUOTA_AI_EXCEEDED, QUOTA_PDF_EXCEEDED)
    if (status === 403 && (errorCode === 'QUOTA_AI_EXCEEDED' || errorCode === 'QUOTA_PDF_EXCEEDED')) {
      return Promise.reject(error);
    }

    // Các lỗi 403 khác mới logout
    if (status === 403) {
      useAuthStore.getState().logout();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default apiClient;