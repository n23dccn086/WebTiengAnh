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
import MemoryMatchGame from "./pages/MemoryMatchGame";
import Quizzes from "./pages/Quizzes";
import QuizDetail from "./pages/QuizDetail";
import SRSDaily from "./pages/SRSDaily";
import SystemDeckList from "./pages/SystemDeckList";
import MemberDetail from "./pages/MemberDetail";
import DictionarySearch from "./components/ui/DictionarySearch";
import FloatingChat from "./components/ui/FloatingChat";
import BackgroundMusic from "./components/ui/BackgroundMusic";
import FontSizeControl from "./components/ui/FontSizeControl";
import PomodoroTimer from "./components/ui/PomodoroTimer";
import { useEffect } from "react";
import GlobalChat from "./components/ui/GlobalChat";

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
import SystemSetList from "./pages/admin/SystemSetList";
import EditSystemSet from "./pages/admin/EditSystemSet";

import ProtectedRoute from "./components/ProtectedRoute";
import useAuthStore from "./store/authStore";
import LogoutButton from "./components/ui/LogoutButton";

import "./App.css";

const AdminRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN")
    return <Navigate to="/dashboard" />;
  return children;
};

function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <nav
      className={`navbar ${user?.role === "PREMIUM" ? "navbarPremium" : ""}`}
    >
      <div className="logo">🌟 EngVocab .🐵.</div>
      <GlobalChat />
      <div className="navLinks">
        <Link to="/" className="link">
          Trang chủ
        </Link>
        {isAuthenticated ? (
          <>
            <Link to="/dashboard" className="link">
              Dashboard
            </Link>
            <Link to="/library" className="link">
              Thư viện
            </Link>
            <DictionarySearch />
            <Link to="/profile" className="link">
              Hồ sơ
            </Link>
            <Link to="/srs/daily" className="link">
              📅 Ôn tập SRS
            </Link>
            {user?.role === "PREMIUM" && (
              <Link to="/premium-dashboard" className="link">
                📊 Premium
              </Link>
            )}
            {user?.role === "USER" && (
              <Link to="/upgrade" className="link">
                💎 Nâng cấp
              </Link>
            )}
            {(user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") && (
              <Link to="/admin" className="link">
                🔧 Admin
              </Link>
            )}
            {user?.full_name && (
              <span
                className={`userName ${user?.role === "PREMIUM" ? "premiumUser" : ""}`}
              >
                👋 {user.full_name}
                {user?.role === "PREMIUM" && (
                  <span className="premiumBadge">⭐ PREMIUM</span>
                )}
              </span>
            )}
            <BackgroundMusic />
            <FontSizeControl />
            <LogoutButton onClick={logout} />
          </>
        ) : (
          <>
            <Link to="/login" className="link">
              Đăng nhập
            </Link>
            <Link to="/register" className="link">
              Đăng ký
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

function App() {
  useEffect(() => {
    const handleFirstInteraction = () => {
      if (window.AudioContext || window.webkitAudioContext) {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === "suspended") ctx.resume();
      }
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("keydown", handleFirstInteraction);
    };
    document.addEventListener("click", handleFirstInteraction);
    document.addEventListener("keydown", handleFirstInteraction);
  }, []);
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

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/library"
            element={
              <ProtectedRoute>
                <Library />
              </ProtectedRoute>
            }
          />
          <Route
            path="/flashcards/service/:serviceId"
            element={
              <ProtectedRoute>
                <Library />
              </ProtectedRoute>
            }
          />

          {/* === CÁC ROUTE ĐẶC BIỆT CHO BỘ THẺ === */}
          <Route
            path="/sets/create"
            element={
              <ProtectedRoute>
                <CreateSetForm />
              </ProtectedRoute>
            }
          />
          {/* ✅ Đặt route /sets/service/:serviceId lên TRƯỚC /sets/:id */}
          <Route
            path="/sets/service/:serviceId"
            element={
              <ProtectedRoute>
                <SystemDeckList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sets/:id/flashcard"
            element={
              <ProtectedRoute>
                <FlashcardStudy />
              </ProtectedRoute>
            }
          />

          <Route
            path="/sets/:id/flashcard-basic"
            element={
              <ProtectedRoute>
                <FlashcardStudyBasic />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sets/:id/practice"
            element={
              <ProtectedRoute>
                <StudyPractice />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sets/:id/test"
            element={
              <ProtectedRoute>
                <StudyTest />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sets/:id"
            element={
              <ProtectedRoute>
                <SetDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/game/:id"
            element={
              <ProtectedRoute>
                <MemoryMatchGame />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quizzes"
            element={
              <ProtectedRoute>
                <Quizzes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quizzes/service/:serviceId"
            element={
              <ProtectedRoute>
                <Quizzes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quizzes/:id"
            element={
              <ProtectedRoute>
                <QuizDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/srs/daily"
            element={
              <ProtectedRoute>
                <SRSDaily />
              </ProtectedRoute>
            }
          />
          <Route
            path="/system-decks/:serviceId"
            element={
              <ProtectedRoute>
                <SystemDeckList />
              </ProtectedRoute>
            }
          />
          <Route path="/team/:id" element={<MemberDetail />} />

          <Route
            path="/upgrade"
            element={
              <ProtectedRoute>
                <PricingTable />
              </ProtectedRoute>
            }
          />
          <Route
            path="/premium-dashboard"
            element={
              <ProtectedRoute>
                <PremiumDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment/result"
            element={
              <ProtectedRoute>
                <PaymentResult />
              </ProtectedRoute>
            }
          />

          {/* ADMIN ROUTES */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <UserManager />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/quizzes"
            element={
              <AdminRoute>
                <QuizManager />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/services"
            element={
              <AdminRoute>
                <ServiceManager />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/transactions"
            element={
              <AdminRoute>
                <TransactionManager />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/staff"
            element={
              <AdminRoute>
                <StaffManager />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/system-sets/create"
            element={
              <AdminRoute>
                <SystemDeckManager />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/system-sets/edit/:id"
            element={
              <AdminRoute>
                <EditSystemSet />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/system-sets"
            element={
              <AdminRoute>
                <SystemSetList />
              </AdminRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <FloatingChat />
      <PomodoroTimer />
    </BrowserRouter>
  );
}

export default App;
