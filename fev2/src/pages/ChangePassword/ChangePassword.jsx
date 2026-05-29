import React, { useState } from 'react';
import apiClient from '../../services/apiClient';
import '../Profile/Profile.css'; 

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });

    if (formData.new_password !== formData.confirm_password) {
      setStatus({ type: 'error', message: 'Mật khẩu nhập lại không khớp!' });
      return;
    }

    setIsLoading(true);
    try {
      const res = await apiClient.put('/users/password', {
        old_password: formData.old_password,
        new_password: formData.new_password
      });
      setStatus({ type: 'success', message: res.data.message || 'Mật khẩu đã được cập nhật an toàn.' });
      setFormData({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Mật khẩu hiện tại không đúng.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="settings-container" style={{ maxWidth: '600px' }}>
      <div className="settings-header">
        <h1>Bảo mật tài khoản</h1>
        <p>Đổi mật khẩu định kỳ giúp tài khoản của bạn an toàn hơn</p>
      </div>

      <div className="settings-main glass-panel" style={{ padding: '40px' }}>
        {status.message && (
          <div className={`status-alert ${status.type}`}>
            <span className="material-symbols-outlined">
              {status.type === 'error' ? 'error' : 'check_circle'}
            </span>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="settings-form">
          <div className="input-group" style={{ marginBottom: '24px' }}>
            <label>Mật khẩu hiện tại</label>
            <input 
              type="password" name="old_password" className="modern-input" 
              placeholder="Nhập mật khẩu cũ..."
              value={formData.old_password} onChange={handleChange} required 
            />
          </div>
          
          <div className="input-group" style={{ marginBottom: '16px' }}>
            <label>Mật khẩu mới</label>
            <input 
              type="password" name="new_password" className="modern-input" 
              placeholder="Ít nhất 6 ký tự"
              value={formData.new_password} onChange={handleChange} required 
            />
          </div>

          <div className="input-group" style={{ marginBottom: '40px' }}>
            <label>Xác nhận mật khẩu mới</label>
            <input 
              type="password" name="confirm_password" className="modern-input" 
              placeholder="Nhập lại mật khẩu mới"
              value={formData.confirm_password} onChange={handleChange} required 
            />
          </div>

          <button type="submit" className="btn-modern-primary" disabled={isLoading} style={{ width: '100%', justifyContent: 'center' }}>
            <span className="material-symbols-outlined">lock_reset</span>
            {isLoading ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;