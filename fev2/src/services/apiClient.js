import axios from 'axios';
import useAuthStore from '../store/authStore';

const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. Tự động gắn accessToken vào mọi request gửi đi
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// 2. TỰ ĐỘNG REFRESH TOKEN KHI HẾT HẠN (LỖI 401)
apiClient.interceptors.response.use(
  (response) => response, // Gọi API thành công thì cho qua bình thường
  async (error) => {
    const originalRequest = error.config;

    // Nếu lỗi 401 (Hết hạn Token) và chưa từng thử refresh lại
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        // Nếu không có Refresh Token -> Bắt đăng nhập lại
        if (!refreshToken) {
          useAuthStore.getState().logout();
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // Gọi API cấp lại Token mới (Dùng axios thuần để không bị vòng lặp)
        const refreshResponse = await axios.post('http://localhost:5000/api/v1/auth/refresh-token', {
          refresh_token: refreshToken
        });

        // Lấy Token mới lưu vào máy
        const newAccessToken = refreshResponse.data.data.accessToken;
        localStorage.setItem('accessToken', newAccessToken);

        // Đổi Token cũ thành Token mới trong cái Request vừa bị lỗi
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Gửi lại Request đó lên Backend
        return apiClient(originalRequest);
        
      } catch (refreshError) {
        // Nếu Refresh Token cũng hết hạn -> Đá văng ra Login
        console.error('Phiên đăng nhập đã hết hạn hoàn toàn!');
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;