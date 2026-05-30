import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import '../Login/Login.css';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState({ type: 'loading', message: 'Đang xác thực email của bạn...' });
  const navigate = useNavigate();
  
  // Dùng useRef để chặn React StrictMode gọi API 2 lần
  const hasCalledAPI = useRef(false);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus({ type: 'error', message: 'Không tìm thấy mã xác thực hợp lệ trên đường dẫn.' });
      return;
    }

    // Nếu đã gọi API rồi thì thoát luôn, không gọi lại nữa
    if (hasCalledAPI.current) return;
    hasCalledAPI.current = true;

    const verifyToken = async () => {
      try {
        const response = await apiClient.post('/auth/verify-email', { token });
        setStatus({ type: 'success', message: response.data.message || 'Xác thực thành công! Tài khoản của bạn đã được kích hoạt.' });
      } catch (err) {
        setStatus({ 
          type: 'error', 
          message: err.response?.data?.message || 'Đường dẫn xác thực không hợp lệ hoặc đã hết hạn.' 
        });
      }
    };

    verifyToken();
  }, [searchParams]);

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel" style={{ textAlign: 'center' }}>
        <div className="auth-logo" style={{ marginBottom: '24px', backgroundColor: status.type === 'error' ? 'var(--error-neon)' : 'var(--primary)' }}>
          <span className="material-symbols-outlined">
            {status.type === 'loading' ? 'hourglass_empty' : status.type === 'error' ? 'error' : 'mark_email_read'}
          </span>
        </div>
        
        <h2 style={{ marginBottom: '16px' }}>Xác thực Email</h2>
        
        <p style={{ 
          color: status.type === 'error' ? 'var(--error-neon)' : status.type === 'success' ? 'var(--secondary-neon)' : 'var(--text-muted)',
          marginBottom: '32px'
        }}>
          {status.message}
        </p>

        {status.type !== 'loading' && (
          <button onClick={() => navigate('/login')} className="btn-primary auth-submit" style={{ width: '100%' }}>
            Quay lại trang Đăng nhập
          </button>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;