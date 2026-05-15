import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginForm from './features/auth/LoginForm';
import RegisterForm from './features/auth/RegisterForm';
import ForgotPasswordForm from './features/auth/ForgotPasswordForm';
import ResetPasswordForm from './features/auth/ResetPasswordForm';
import VerifyEmail from './features/auth/VerifyEmail';
import Dashboard from './pages/Dashboard';
import FlashcardList from './pages/FlashcardList';
import FlashcardStudy from './pages/FlashcardStudy';
import ProfilePage from './features/profile/ProfilePage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/forgot-password" element={<ForgotPasswordForm />} />
        <Route path="/reset-password" element={<ResetPasswordForm />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/flashcards/service/:serviceId" element={<ProtectedRoute><FlashcardList /></ProtectedRoute>} />
        <Route path="/flashcards/study/:serviceId" element={<ProtectedRoute><FlashcardStudy /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;