// frontend/src/App.jsx
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
import StudyPractice from "./pages/StudyPractice";
import StudyTest from "./pages/StudyTest";
import ProfilePage from "./features/profile/ProfilePage";

import Quizzes from "./pages/Quizzes";
import QuizDetail from "./pages/QuizDetail";

import ProtectedRoute from "./components/ProtectedRoute";
import useAuthStore from "./store/authStore";

import "./App.css";

function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <nav style={navStyle}>
      <div style={logoStyle}>📘 EngVocab</div>

      <div style={navLinksStyle}>
        <Link to="/" style={linkStyle}>
          Trang chủ
        </Link>

        {isAuthenticated ? (
          <>
            <Link to="/dashboard" style={linkStyle}>
              Dashboard
            </Link>

            <Link to="/library" style={linkStyle}>
              Thư viện
            </Link>

            <Link to="/profile" style={linkStyle}>
              Hồ sơ
            </Link>

            {user?.full_name && (
              <span style={userNameStyle}>👋 {user.full_name}</span>
            )}

            <button type="button" onClick={logout} style={logoutBtnStyle}>
              Đăng xuất
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={linkStyle}>
              Đăng nhập
            </Link>

            <Link to="/register" style={linkStyle}>
              Đăng ký
            </Link>
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
          {/* PUBLIC ROUTES */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/forgot-password" element={<ForgotPasswordForm />} />
          <Route path="/reset-password" element={<ResetPasswordForm />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* PROTECTED ROUTES */}
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

          {/* Route này khớp với nút "Học từ vựng" ở Home.jsx */}
          <Route
            path="/flashcards/service/:serviceId"
            element={
              <ProtectedRoute>
                <Library />
              </ProtectedRoute>
            }
          />

          <Route
            path="/sets/create"
            element={
              <ProtectedRoute>
                <CreateSetForm />
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
            path="/sets/:id/flashcard"
            element={
              <ProtectedRoute>
                <FlashcardStudy />
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

          {/* Route này khớp với nút "Làm quiz" ở Home.jsx */}
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

          {/* Nếu đường dẫn sai thì quay về trang chủ */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

const navStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "0 2rem",
  background: "rgba(0,0,0,0.8)",
  backdropFilter: "blur(10px)",
  color: "white",
  height: "60px",
  zIndex: 1000,
  fontFamily:
    'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const logoStyle = {
  fontSize: "1.5rem",
  fontWeight: "bold",
};

const navLinksStyle = {
  display: "flex",
  gap: "1rem",
  alignItems: "center",
};

const linkStyle = {
  color: "white",
  textDecoration: "none",
  padding: "0.5rem 1rem",
  borderRadius: "40px",
  transition: "0.2s",
};

const userNameStyle = {
  color: "#ffefb9",
  fontWeight: "600",
};

const logoutBtnStyle = {
  background: "#dc3545",
  border: "none",
  padding: "0.5rem 1rem",
  borderRadius: "40px",
  color: "white",
  cursor: "pointer",
  fontFamily: "inherit",
};

export default App;
