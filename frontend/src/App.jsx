import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginForm from './features/auth/LoginForm';
import useAuthStore from './store/authStore';

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route
          path="/dashboard"
          element={isAuthenticated ? <div>Dashboard</div> : <Navigate to="/login" />}
        />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;