import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1", // nếu sau này có biến môi trường thì thay bằng import.meta.env.VITE_API_URL
  headers: { "Content-Type": "application/json" },
});

// Interceptor: gắn token vào request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: xử lý lỗi 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("accessToken");
      // Không redirect ngay ở đây vì có thể dùng React Router sau
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// Hàm login gắn luôn vào apiClient để tiện dùng
export const loginApi = async (email, password) => {
  const response = await apiClient.post("/auth/login", { email, password });
  return response.data;
};

export default apiClient;
