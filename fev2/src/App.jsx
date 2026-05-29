import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout/MainLayout';
import useAuthStore from './store/authStore';

// Import các trang Khách
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import VerifyEmail from './pages/VerifyEmail/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import ResetPassword from './pages/ResetPassword/ResetPassword';

// Import các trang Nội bộ
import Profile from './pages/Profile/Profile';
import ChangePassword from './pages/ChangePassword/ChangePassword';
import CreateDeck from "./pages/Deck/CreateDeck";
import EditDeck from './pages/Deck/EditDeck';
import Library from './pages/Library/Library';
import StudyDeck from './pages/StudyDeck/StudyDeck';

// Import các trang phân hệ AI & SRS
import StudyPractice from './pages/StudyPractice/StudyPractice';
import StudyTest from './pages/StudyTest/StudyTest';
import TestResult from './pages/StudyTest/TestResult';
import SRSDaily from './pages/SRSDaily/SRSDaily';

// Import Layout và các trang Admin
import AdminLayout from './layouts/AdminLayout/AdminLayout';
import AdminDashboard from './pages/Admin/Dashboard/AdminDashboard';
// Import sẵn, sẽ tạo file ở các bước sau:
import AdminUsers from './pages/Admin/Users/AdminUsers';
import AdminServices from './pages/Admin/Services/AdminServices';
import AdminServiceSets from './pages/Admin/Services/AdminServiceSets';
import AdminTransactions from './pages/Admin/Transactions/AdminTransactions';
import AdminStaff from './pages/Admin/Staff/AdminStaff';

// import AdminSystemSets from './pages/Admin/SystemSets/AdminSystemSets';

// ==========================================
// BỘ LỌC ĐIỀU HƯỚNG (ROUTE GUARDS)
// ==========================================

// 1. Chặn người chưa đăng nhập
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

// 2. Chặn người đã đăng nhập quay lại các trang Auth
// 2. Chặn người đã đăng nhập quay lại các trang Auth
const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (isAuthenticated) {
    // Phân loại khách: Ai là Admin/Super Admin, ai là User thường
    const isAdmin = user?.role === 'ADMIN' || 
                    user?.role === 'SUPER_ADMIN' || 
                    user?.role_id === 4 || 
                    user?.role_id === 5;
                    
    // Đá về đúng nhà của họ
    return <Navigate to={isAdmin ? "/admin" : "/library"} replace />;
  }
  
  return children;
};

// 3. 🔒 CHẶN USER THƯỜNG VÀO TRANG ADMIN
// 3. 🔒 CHẶN USER THƯỜNG VÀO TRANG ADMIN
const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  
  // 🟢 BẠN HÃY BẤM F12 XEM DÒNG NÀY IN RA CÁI GÌ NHÉ
  console.log("🔍 Kiểm tra quyền Admin - User hiện tại:", user);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  // Chấp nhận cả trường hợp BE trả về tên chuỗi ('SUPER_ADMIN') hoặc ID số (4, 5)
  const isAdmin = user?.role === 'ADMIN' || 
                  user?.role === 'SUPER_ADMIN' || 
                  user?.role_id === 4 || 
                  user?.role_id === 5;

  if (!isAdmin) {
    return <Navigate to="/library" replace />;
  }
  
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* ==========================================
            LUỒNG KHÁCH (Public)
            ========================================== */}
        <Route element={<PublicRoute><Home /></PublicRoute>}>
          <Route path="/" element={null} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        {/* ==========================================
            LUỒNG NGƯỜI DÙNG (Private)
            ========================================== */}
        <Route path="/library" element={<ProtectedRoute><MainLayout title="Thư viện của bạn"><Library /></MainLayout></ProtectedRoute>} />
        <Route path="/create-deck" element={<ProtectedRoute><MainLayout title="Tạo bộ thẻ mới"><CreateDeck /></MainLayout></ProtectedRoute>} />
        <Route path="/edit-deck/:id" element={<ProtectedRoute><MainLayout title="Chỉnh sửa bộ thẻ"><EditDeck /></MainLayout></ProtectedRoute>} />
        <Route path="/study/:deckId" element={<ProtectedRoute><MainLayout title="Học tập"><StudyDeck /></MainLayout></ProtectedRoute>} />
        
        <Route path="/practice/:deckId" element={<ProtectedRoute><StudyPractice /></ProtectedRoute>} />
        <Route path="/test/:deckId" element={<ProtectedRoute><StudyTest /></ProtectedRoute>} />
        <Route path="/test/:deckId/result/:attemptId" element={<ProtectedRoute><TestResult /></ProtectedRoute>} />
        <Route path="/daily-review" element={<ProtectedRoute><SRSDaily /></ProtectedRoute>} />
        
        <Route path="/profile" element={<ProtectedRoute><MainLayout title="Hồ sơ cá nhân"><Profile /></MainLayout></ProtectedRoute>} />
        <Route path="/change-password" element={<ProtectedRoute><MainLayout title="Đổi mật khẩu"><ChangePassword /></MainLayout></ProtectedRoute>} />

        {/* ==========================================
            LUỒNG QUẢN TRỊ VIÊN (Admin Only)
            ========================================== */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          {/* Dashboard mặc định */}
          <Route index element={<AdminDashboard />} />
          
          {/* CÁC ROUTE TIẾP THEO (Tạm thời bỏ comment khi code xong) */}
          <Route path="users" element={<AdminUsers />} />
          <Route path="services" element={<AdminServices />} />
          <Route path="services/:serviceId/sets" element={<AdminServiceSets />} />
          <Route path="transactions" element={<AdminTransactions />} />
          {/* <Route path="system-sets" element={<AdminSystemSets />} /> */}
          <Route path="staff" element={<AdminStaff />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;