// frontend/src/features/profile/ProfilePage.jsx
import { useEffect, useState } from 'react';
import useAuthStore from '../../store/authStore';
import NeonToggle from '../../components/ui/NeonToggle';
import LogoutButton from '../../components/ui/LogoutButton';
import GrumpySwanInput from '../../components/ui/GrumpySwanInput'; // ✅ import
import styles from './profile.module.css';

const ProfilePage = () => {
  const { user, fetchProfile, updateProfile, changePassword, logout, updateReminder } = useAuthStore();
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [reminderEnabled, setReminderEnabled] = useState(user?.is_reminder_enabled || true);
  const [loadingReminder, setLoadingReminder] = useState(false);

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const inputWrapperStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%'
  };
  const eyeButtonStyle = {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.2rem',
    color: '#aaa',
    padding: 0,
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1
  };

  useEffect(() => {
    if (user?.id) {
      setFullName(user.full_name || '');
      if (user.dob) {
        const dateObj = new Date(user.dob);
        if (!isNaN(dateObj.getTime())) {
          setDob(dateObj.toISOString().split('T')[0]);
        } else {
          setDob('');
        }
      } else {
        setDob('');
      }
      setPhone(user.phone || '');
      setReminderEnabled(user.is_reminder_enabled || true);
    } else {
      fetchProfile();
    }
  }, [user, fetchProfile]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    const payload = {};
    if (fullName !== user?.full_name) payload.full_name = fullName;
    if (dob !== (user?.dob ? new Date(user.dob).toISOString().split('T')[0] : '')) payload.dob = dob || null;
    if (phone !== (user?.phone || '')) payload.phone = phone || null;
    if (Object.keys(payload).length === 0) {
      setMessage('Không có thay đổi nào.');
      setLoading(false);
      return;
    }
    const result = await updateProfile(payload);
    if (result.success) setMessage(result.message);
    else setError(result.message);
    setLoading(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    setLoading(true);
    const result = await changePassword(oldPassword, newPassword);
    if (result.success) {
      setMessage(result.message);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  const handleToggleReminder = async () => {
    setLoadingReminder(true);
    const newValue = !reminderEnabled;
    const result = await updateReminder(newValue);
    if (result.success) {
      setReminderEnabled(newValue);
      setMessage(result.message);
    } else {
      setError(result.message);
    }
    setLoadingReminder(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2>Hồ sơ của tôi</h2>
          <LogoutButton onClick={logout} />
        </div>
        <div className={styles.tabs}>
          <button className={activeTab === 'profile' ? styles.activeTab : styles.tab} onClick={() => setActiveTab('profile')}>Thông tin cá nhân</button>
          <button className={activeTab === 'password' ? styles.activeTab : styles.tab} onClick={() => setActiveTab('password')}>Đổi mật khẩu</button>
          <button className={activeTab === 'settings' ? styles.activeTab : styles.tab} onClick={() => setActiveTab('settings')}>Cài đặt</button>
        </div>
        {message && <div className={styles.success}>{message}</div>}
        {error && <div className={styles.error}>{error}</div>}
        {activeTab === 'profile' && (
          <form onSubmit={handleUpdateProfile} className={styles.form}>
            <div className={styles.field}>
              <label>Email</label>
              <input type="email" value={user?.email || ''} disabled className={styles.disabledInput} />
            </div>
            {/* Thay thế input họ tên bằng GrumpySwanInput */}
            <GrumpySwanInput
              label="Họ và tên"
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
            />
            {/* Thay thế input ngày sinh bằng GrumpySwanInput */}
            <GrumpySwanInput
              label="Ngày sinh"
              type="date"
              value={dob}
              onChange={e => setDob(e.target.value)}
            />
            {/* Thay thế input số điện thoại bằng GrumpySwanInput */}
            <GrumpySwanInput
              label="Số điện thoại"
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
            <button type="submit" disabled={loading} className={styles.button}>{loading ? 'Đang lưu...' : 'Cập nhật'}</button>
          </form>
        )}
        {activeTab === 'password' && (
          <form onSubmit={handleChangePassword} className={styles.form}>
            <div className={styles.field}>
              <label>Mật khẩu cũ</label>
              <div style={inputWrapperStyle}>
                <input
                  type={showOldPassword ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  required
                  className={styles.input}
                  style={{ flex: 1, paddingRight: '40px' }}
                />
                <button type="button" onClick={() => setShowOldPassword(!showOldPassword)} style={eyeButtonStyle}>
                  {showOldPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <div className={styles.field}>
              <label>Mật khẩu mới</label>
              <div style={inputWrapperStyle}>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  className={styles.input}
                  style={{ flex: 1, paddingRight: '40px' }}
                />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} style={eyeButtonStyle}>
                  {showNewPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <div className={styles.field}>
              <label>Xác nhận mật khẩu mới</label>
              <div style={inputWrapperStyle}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  className={styles.input}
                  style={{ flex: 1, paddingRight: '40px' }}
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={eyeButtonStyle}>
                  {showConfirmPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className={styles.button}>{loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}</button>
          </form>
        )}
        {activeTab === 'settings' && (
          <div className={styles.settings}>
            <div className={styles.settingItem}>
              <label>Nhắc nhở học tập hàng ngày</label>
              <NeonToggle checked={reminderEnabled} onChange={handleToggleReminder} id="reminderToggle" />
              <p className={styles.settingNote}>Sẽ nhận email nhắc nhở lúc 8h sáng nếu có từ đến hạn</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;