import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import useAuthStore from '../../store/authStore';
// Import UI Component tái sử dụng
import Input from '../../components/ui/Input/Input';
import Button from '../../components/ui/Button/Button';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const loginSuccess = useAuthStore((state) => state.loginSuccess);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await apiClient.post('/auth/login', formData);
    const { accessToken, refreshToken, user } = response.data.data;
    loginSuccess(user, accessToken, refreshToken);
    
    // 🟢 ĐÃ FIX: Chuyển hướng thông minh dựa vào Role
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role_id === 4 || user.role_id === 5) {
      navigate('/admin');
    } else {
      navigate('/library');
    }
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi đăng nhập.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <button 
          onClick={() => navigate('/')} 
          style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <span className="material-symbols-outlined">close</span>
        </button>
        
        <div className="auth-header">
          <div className="auth-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px' }}>psychology</span>
          </div>
          <h2>Welcome Back</h2>
          <p>Đăng nhập để tiếp tục học tập</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <Input 
            label="Email" 
            type="email" 
            name="email" 
            placeholder="name@student.ptithcm.edu.vn"
            value={formData.email}
            onChange={handleChange}
            required 
          />
          
          {/* Component Input đã tự động xử lý con mắt bật/tắt mật khẩu cực mượt */}
          <Input 
            label="Mật khẩu" 
            type="password" 
            name="password" 
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            required 
          />
          
          <div className="auth-options">
            <a href="/forgot-password" className="forgot-link">Quên mật khẩu?</a>
          </div>

          <Button type="submit" variant="primary" disabled={isLoading} style={{ width: '100%', marginTop: '8px' }}>
            {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
          </Button>
        </form>

        <div className="auth-footer">
          Chưa có tài khoản? <a href="/register">Đăng ký ngay</a>
        </div>
      </div>
    </div>
  );
};

export default Login;