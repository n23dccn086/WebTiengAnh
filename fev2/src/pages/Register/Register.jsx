import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
// IMPORT CÁC UI COMPONENT DÙNG CHUNG ĐỂ CLEAN CODE
import Input from '../../components/ui/Input/Input';
import Button from '../../components/ui/Button/Button';
import '../Login/Login.css';

const Register = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false); 
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirm_password) {
      setError('Mật khẩu nhập lại không khớp. Vui lòng kiểm tra lại!');
      return;
    }

    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự để đảm bảo an toàn.');
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.post('/auth/register', {
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password
      });
      setIsSuccess(true);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Có lỗi xảy ra khi đăng ký.';
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // MÀN HÌNH UX THÔNG BÁO GỬI EMAIL XÁC THỰC THÀNH CÔNG
  if (isSuccess) {
    return (
      <div className="auth-container">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div className="auth-logo" style={{ color: 'var(--accent-hover)', marginBottom: '24px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '48px' }}>mark_email_unread</span>
          </div>
          <h2 style={{ marginBottom: '16px' }}>Kiểm tra Email của bạn</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px', lineHeight: '1.6' }}>
            Chúng tôi đã gửi một liên kết xác thực đến <br />
            <strong style={{ color: 'var(--text-main)' }}>{formData.email}</strong><br />
            Vui lòng kiểm tra hộp thư đến để kích hoạt tài khoản.
          </p>
          <Button onClick={() => navigate('/login')} variant="primary" style={{ width: '100%' }}>
            Trở về trang Đăng nhập
          </Button>
        </div>
      </div>
    );
  }

  // FORM ĐĂNG KÝ CHUẨN ĐÃ ĐƯỢC LÀM SẠCH
  return (
    <div className="auth-container">
      <div className="auth-card">
        <button 
          onClick={() => navigate('/')} 
          style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="auth-header">
          <div className="auth-logo">
            <span className="material-symbols-outlined" style={{ fontSize: '48px' }}>person_add</span>
          </div>
          <h2>Tạo tài khoản mới</h2>
          <p>Bắt đầu hành trình học tập cùng NeuralLearn</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <Input 
            label="Họ và Tên" 
            type="text" 
            name="full_name" 
            placeholder="Ví dụ: Nguyễn Văn A"
            value={formData.full_name} 
            onChange={handleChange} 
            required 
          />
          
          <Input 
            label="Email" 
            type="email" 
            name="email" 
            placeholder="n23dccn089@student.ptithcm.edu.vn"
            value={formData.email} 
            onChange={handleChange} 
            required 
          />
          
          {/* Hàng chia đôi cho mật khẩu cấu trúc gọn gàng */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input 
              label="Mật khẩu" 
              type="password" 
              name="password" 
              placeholder="••••••••"
              value={formData.password} 
              onChange={handleChange} 
              required 
            />
            <Input 
              label="Nhập lại mật khẩu" 
              type="password" 
              name="confirm_password" 
              placeholder="••••••••"
              value={formData.confirm_password} 
              onChange={handleChange} 
              required 
            />
          </div>

          <Button type="submit" variant="primary" disabled={isLoading} style={{ width: '100%', marginTop: '12px' }}>
            {isLoading ? 'Đang tạo tài khoản...' : 'Đăng ký ngay'}
          </Button>
        </form>

        <div className="auth-footer">
          Đã có tài khoản? <a href="/login">Đăng nhập ngay</a>
        </div>
      </div>
    </div>
  );
};

export default Register;