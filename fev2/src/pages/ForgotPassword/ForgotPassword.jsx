import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import '../Login/Login.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });
    setIsLoading(true);

    try {
      const response = await apiClient.post('/auth/forgot-password', { email });
      // Thành công -> Hiện màn hình xanh yêu cầu check mail
      setStatus({ type: 'success', message: response.data.message || 'Link khôi phục đã được gửi!' });
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại sau.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Màn hình Thành công (Đã gửi email)
  if (status.type === 'success') {
    return (
      <div className="auth-container">
        <div className="auth-card glass-panel" style={{ textAlign: 'center' }}>
          <div className="auth-logo" style={{ backgroundColor: 'var(--secondary-neon)', marginBottom: '24px' }}>
            <span className="material-symbols-outlined" style={{ color: '#080816' }}>mark_email_unread</span>
          </div>
          <h2 style={{ marginBottom: '16px' }}>Kiểm tra Email</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
            {status.message}
          </p>
          <button onClick={() => navigate('/login')} className="btn-primary auth-submit" style={{ width: '100%' }}>
            Quay lại Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  // Màn hình nhập Email
  return (
    <div className="auth-container">
      <div className="auth-card glass-panel">
        <div className="auth-header">
          <div className="auth-logo">
            <span className="material-symbols-outlined glow-primary">lock_reset</span>
          </div>
          <h2>Khôi phục mật khẩu</h2>
          <p>Nhập email của bạn để nhận link đặt lại mật khẩu</p>
        </div>

        {status.type === 'error' && (
          <div className="auth-error glow-error">{status.message}</div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email đăng ký</label>
            <input
              type="email"
              className="cyber-input"
              placeholder="name@student.ptithcm.edu.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary auth-submit" disabled={isLoading} style={{ marginTop: '16px' }}>
            {isLoading ? 'Đang gửi yêu cầu...' : 'Gửi link khôi phục'}
          </button>
        </form>

        <div className="auth-footer">
          Nhớ mật khẩu rồi? <a href="/login">Đăng nhập ngay</a>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;