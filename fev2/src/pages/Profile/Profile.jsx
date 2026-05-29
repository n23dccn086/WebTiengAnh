import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import useAuthStore from '../../store/authStore';
import './Profile.css';

const Profile = () => {
  const { user, loginSuccess } = useAuthStore();
  const [formData, setFormData] = useState({
    full_name: '',
    dob: '',
    phone: '',
    is_reminder_enabled: true
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiClient.get('/users/profile');
        const data = res.data.data;
        
        // UX Fix: API trả về DATETIME có đuôi "T17:00:00.000Z", 
        // thẻ <input type="date"> chỉ nhận format YYYY-MM-DD nên phải cắt bớt
        let formattedDob = '';
        if (data.dob) {
          formattedDob = data.dob.split('T')[0];
        }

        setFormData({
          full_name: data.full_name || '',
          dob: formattedDob,
          phone: data.phone || '',
          is_reminder_enabled: data.is_reminder_enabled === 1 || data.is_reminder_enabled === true
        });
      } catch (err) {
        setStatus({ type: 'error', message: 'Không thể tải thông tin hồ sơ.' });
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: '', message: '' });

    try {
      // FIX LỖI 500 MYSQL: Nếu chuỗi rỗng thì ép thành null trước khi gửi
      await apiClient.put('/users/profile', {
        full_name: formData.full_name,
        dob: formData.dob.trim() !== '' ? formData.dob : null,
        phone: formData.phone.trim() !== '' ? formData.phone : null
      });

      await apiClient.put('/users/reminder', {
        is_reminder_enabled: formData.is_reminder_enabled
      });

      setStatus({ type: 'success', message: 'Hồ sơ đã được lưu thành công!' });
      
      const currentToken = localStorage.getItem('accessToken');
      const currentRefresh = localStorage.getItem('refreshToken');
      loginSuccess({ ...user, full_name: formData.full_name }, currentToken, currentRefresh);

    } catch (err) {
      setStatus({ type: 'error', message: err.response?.data?.message || 'Có lỗi xảy ra khi lưu.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Hồ sơ cá nhân</h1>
        <p>Quản lý thông tin và thiết lập tài khoản của bạn</p>
      </div>

      <div className="settings-layout">
        {/* Cột trái: Avatar & Info */}
        <div className="settings-sidebar glass-panel">
          <div className="settings-avatar">
            {formData.full_name ? formData.full_name.charAt(0).toUpperCase() : 'U'}
          </div>
          <h2 className="settings-name">{formData.full_name || 'Người dùng'}</h2>
          <p className="settings-email">{user?.email}</p>
          <div className="settings-role">
            Vai trò: <span className={user?.role === 'PREMIUM' ? 'badge-pro' : 'badge-user'}>{user?.role}</span>
          </div>
        </div>

        {/* Cột phải: Form nhập liệu */}
        <div className="settings-main glass-panel">
          {status.message && (
            <div className={`status-alert ${status.type}`}>
              <span className="material-symbols-outlined">
                {status.type === 'error' ? 'error' : 'check_circle'}
              </span>
              {status.message}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="settings-form">
            <div className="input-group">
              <label>Họ và tên</label>
              <input 
                type="text" name="full_name" className="modern-input" 
                value={formData.full_name} onChange={handleChange} required 
              />
            </div>
            
            <div className="input-row">
              <div className="input-group">
                <label>Ngày sinh</label>
                <input 
                  type="date" name="dob" className="modern-input" 
                  value={formData.dob} onChange={handleChange} 
                />
              </div>
              <div className="input-group">
                <label>Số điện thoại</label>
                <input 
                  type="tel" name="phone" className="modern-input" 
                  placeholder="Để trống nếu không có"
                  value={formData.phone} onChange={handleChange} 
                />
              </div>
            </div>

            {/* UX Fix: Nút Toggle xịn xò thay cho Checkbox cùi bắp */}
            <div className="toggle-container">
              <div className="toggle-info">
                <h4>Thông báo qua Email</h4>
                <p>Nhận email nhắc nhở ôn tập Flashcard (SRS) hàng ngày.</p>
              </div>
              <label className="switch">
                <input 
                  type="checkbox" name="is_reminder_enabled"
                  checked={formData.is_reminder_enabled} onChange={handleChange}
                />
                <span className="slider round"></span>
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-modern-primary" disabled={isLoading}>
                {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;