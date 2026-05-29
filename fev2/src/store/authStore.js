import { create } from 'zustand';

// Đọc thông tin user từ LocalStorage
const getUserFromStorage = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

const useAuthStore = create((set) => {
  // Đóng gói logic xóa dữ liệu vào 1 biến chung
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false });
  };

  return {
    user: getUserFromStorage(),
    isAuthenticated: !!localStorage.getItem('accessToken'),

    // Hàm Đăng nhập
    loginSuccess: (user, accessToken, refreshToken) => {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, isAuthenticated: true });
    },

    // 🟢 TRICK: Khai báo cả 2 tên trỏ về cùng 1 hàm!
    // Code mới gọi logout() hay code cũ gọi logoutSuccess() đều chạy rẹt rẹt!
    logout: handleLogout,
    logoutSuccess: handleLogout
  };
});

export default useAuthStore;