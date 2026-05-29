import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import '../Login/Login.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token'); // Lấy token từ URL
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ new_password: '', confirm_password: '' });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  // Chặn user nếu vào thẳng trang này mà không có token
  if (!token) {
    return (
      <div className="auth-container">
        <div className="auth-card glass-panel" style={{ textAlign: 'center' }}>
          <div className="auth-error glow-error">Đường dẫn không hợp lệ hoặc thiếu mã xác thực.</div>
          <button onClick={() => navigate('/login')} className="btn-primary auth-submit" style={{ width: '100%', marginTop: '16px' }}>
            Quay lại Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });

    // Validate UX: Mật khẩu khớp nhau
    if (formData.new_password !== formData.confirm_password) {
      setStatus({ type: 'error', message: 'Mật khẩu nhập lại không khớp!' });
      return;
    }

    if (formData.new_password.length < 6) {
      setStatus({ type: 'error', message: 'Mật khẩu phải có ít nhất 6 ký tự.' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/reset-password', {
        token: token,
        new_password: formData.new_password
      });
      // Thành công -> Hiện màn hình đổi pass thành công
      setStatus({ type: 'success', message: response.data.message || 'Mật khẩu đã được thay đổi thành công!' });
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Token không hợp lệ hoặc đã hết hạn.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Màn hình Thành công (Đã đổi Pass xong)
  if (status.type === 'success') {
    return (
      <div className="auth-container">
        <div className="auth-card glass-panel" style={{ textAlign: 'center' }}>
          <div className="auth-logo" style={{ backgroundColor: 'var(--secondary-neon)', marginBottom: '24px' }}>
            <span className="material-symbols-outlined" style={{ color: '#080816' }}>check_circle</span>
          </div>
          <h2 style={{ marginBottom: '16px' }}>Thành công!</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
            {status.message}
          </p>
          <button onClick={() => navigate('/login')} className="btn-primary auth-submit" style={{ width: '100%' }}>
            Đăng nhập ngay
          </button>
        </div>
      </div>
    );
  }

  // Màn hình nhập Pass mới
  return (
    <div className="auth-container">
      <div className="auth-card glass-panel">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="material-symbols-outlined glow-primary">key</span>
          </div>
          <h2>Mật khẩu mới</h2>
          <p>Vui lòng nhập mật khẩu mới cho tài khoản của bạn</p>
        </div>

        {status.type === 'error' && (
          <div className="auth-error glow-error">{status.message}</div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Mật khẩu mới</label>
            <input
              type="password" name="new_password" className="cyber-input" placeholder="••••••••"
              value={formData.new_password} onChange={handleChange} required
            />
          </div>
          <div className="form-group">
            <label>Xác nhận mật khẩu mới</label>
            <input
              type="password" name="confirm_password" className="cyber-input" placeholder="••••••••"
              value={formData.confirm_password} onChange={handleChange} required
            />
          </div>

          <button type="submit" className="btn-primary auth-submit" disabled={isLoading} style={{ marginTop: '16px' }}>
            {isLoading ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;