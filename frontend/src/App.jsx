import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";

import Home from "./pages/Home";
import LoginForm from "./features/auth/LoginForm";
import RegisterForm from "./features/auth/RegisterForm";
import ForgotPasswordForm from "./features/auth/ForgotPasswordForm";
import ResetPasswordForm from "./features/auth/ResetPasswordForm";
import VerifyEmail from "./features/auth/VerifyEmail";

import Dashboard from "./pages/Dashboard";
import Library from "./pages/Library";
import SetDetail from "./pages/SetDetail";
import CreateSetForm from "./features/flashcards/CreateSetForm";
import FlashcardStudy from "./pages/FlashcardStudy";
import FlashcardStudyBasic from "./pages/FlashcardStudyBasic";
import StudyPractice from "./pages/StudyPractice";
import StudyTest from "./pages/StudyTest";
import ProfilePage from "./features/profile/ProfilePage";

import Quizzes from "./pages/Quizzes";
import QuizDetail from "./pages/QuizDetail";
import SRSDaily from "./pages/SRSDaily";
import SystemDeckList from "./pages/SystemDeckList";

// Cụm 2: Premium & Thanh toán
import PremiumDashboard from "./pages/PremiumDashboard";
import PricingTable from "./features/premium/PricingTable";
import PaymentResult from "./pages/PaymentResult";

// Cụm 3: Admin Panel
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManager from "./pages/admin/UserManager";
import QuizManager from "./pages/admin/QuizManager";
import ServiceManager from "./pages/admin/ServiceManager";
import SystemDeckManager from "./pages/admin/SystemDeckManager";
import TransactionManager from "./pages/admin/TransactionManager";
import StaffManager from "./pages/admin/StaffManager";

import ProtectedRoute from "./components/ProtectedRoute";
import useAuthStore from "./store/authStore";
import LogoutButton from "./components/ui/LogoutButton";

import "./App.css";

const AdminRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN") return <Navigate to="/dashboard" />;
  return children;
};

function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <nav style={navStyle}>
      <div style={logoStyle}>📘 EngVocab</div>
      <div style={navLinksStyle}>
        <Link to="/" style={linkStyle}>Trang chủ</Link>
        {isAuthenticated ? (
          <>
            <Link to="/dashboard" style={linkStyle}>Dashboard</Link>
            <Link to="/library" style={linkStyle}>Thư viện</Link>
            <Link to="/profile" style={linkStyle}>Hồ sơ</Link>
            <Link to="/srs/daily" style={linkStyle}>📅 Ôn tập SRS</Link>
            {user?.role === "PREMIUM" ? (
              <Link to="/premium-dashboard" style={linkStyle}>📊 Premium</Link>
            ) : (
              <Link to="/upgrade" style={linkStyle}>💎 Nâng cấp</Link>
            )}
            {(user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") && (
              <Link to="/admin" style={linkStyle}>🔧 Admin</Link>
            )}
            {user?.full_name && <span style={userNameStyle}>👋 {user.full_name}</span>}
            <LogoutButton onClick={logout} />
          </>
        ) : (
          <>
            <Link to="/login" style={linkStyle}>Đăng nhập</Link>
            <Link to="/register" style={linkStyle}>Đăng ký</Link>
          </>
        )}
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div style={{ paddingTop: "70px" }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/forgot-password" element={<ForgotPasswordForm />} />
          <Route path="/reset-password" element={<ResetPasswordForm />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
          <Route path="/flashcards/service/:serviceId" element={<ProtectedRoute><Library /></ProtectedRoute>} />
          <Route path="/sets/create" element={<ProtectedRoute><CreateSetForm /></ProtectedRoute>} />
          <Route path="/sets/:id" element={<ProtectedRoute><SetDetail /></ProtectedRoute>} />
          <Route path="/sets/:id/flashcard" element={<ProtectedRoute><FlashcardStudy /></ProtectedRoute>} />
          <Route path="/sets/:id/flashcard-basic" element={<ProtectedRoute><FlashcardStudyBasic /></ProtectedRoute>} />
          <Route path="/sets/:id/practice" element={<ProtectedRoute><StudyPractice /></ProtectedRoute>} />
          <Route path="/sets/:id/test" element={<ProtectedRoute><StudyTest /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/quizzes" element={<ProtectedRoute><Quizzes /></ProtectedRoute>} />
          <Route path="/quizzes/service/:serviceId" element={<ProtectedRoute><Quizzes /></ProtectedRoute>} />
          <Route path="/quizzes/:id" element={<ProtectedRoute><QuizDetail /></ProtectedRoute>} />
          <Route path="/srs/daily" element={<ProtectedRoute><SRSDaily /></ProtectedRoute>} />
          <Route path="/system-decks/:serviceId" element={<ProtectedRoute><SystemDeckList /></ProtectedRoute>} />

          <Route path="/upgrade" element={<ProtectedRoute><PricingTable /></ProtectedRoute>} />
          <Route path="/premium-dashboard" element={<ProtectedRoute><PremiumDashboard /></ProtectedRoute>} />
          <Route path="/payment/result" element={<ProtectedRoute><PaymentResult /></ProtectedRoute>} />

          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><UserManager /></AdminRoute>} />
          <Route path="/admin/quizzes" element={<AdminRoute><QuizManager /></AdminRoute>} />
          <Route path="/admin/services" element={<AdminRoute><ServiceManager /></AdminRoute>} />
          <Route path="/admin/system-sets" element={<AdminRoute><SystemDeckManager /></AdminRoute>} />
          <Route path="/admin/transactions" element={<AdminRoute><TransactionManager /></AdminRoute>} />
          <Route path="/admin/staff" element={<AdminRoute><StaffManager /></AdminRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

const navStyle = {
  position: "fixed", top: 0, left: 0, right: 0, display: "flex", justifyContent: "space-between",
  alignItems: "center", padding: "0 2rem", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)",
  color: "white", height: "60px", zIndex: 1000,
  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};
const logoStyle = { fontSize: "1.5rem", fontWeight: "bold" };
const navLinksStyle = { display: "flex", gap: "1rem", alignItems: "center" };
const linkStyle = { color: "white", textDecoration: "none", padding: "0.5rem 1rem", borderRadius: "40px", transition: "0.2s" };
const userNameStyle = { color: "#ffefb9", fontWeight: "600" };

export default App;