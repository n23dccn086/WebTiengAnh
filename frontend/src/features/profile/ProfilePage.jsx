import { useEffect, useState } from 'react';
import useAuthStore from '../../store/authStore';
import styles from './profile.module.css';

const ProfilePage = () => {
  const { user, fetchProfile, updateProfile, changePassword, logout } = useAuthStore();
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

  useEffect(() => {
    if (user?.id) {
      setFullName(user.full_name || '');
      setDob(user.dob || '');
      setPhone(user.phone || '');
    } else {
      fetchProfile();
    }
  }, [user, fetchProfile]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    const result = await updateProfile({ full_name: fullName, dob, phone });
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

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2>Hồ sơ của tôi</h2>
          <button onClick={logout} className={styles.logoutBtn}>Đăng xuất</button>
        </div>
        <div className={styles.tabs}>
          <button className={activeTab === 'profile' ? styles.activeTab : styles.tab} onClick={() => setActiveTab('profile')}>Thông tin cá nhân</button>
          <button className={activeTab === 'password' ? styles.activeTab : styles.tab} onClick={() => setActiveTab('password')}>Đổi mật khẩu</button>
        </div>
        {message && <div className={styles.success}>{message}</div>}
        {error && <div className={styles.error}>{error}</div>}
        {activeTab === 'profile' && (
          <form onSubmit={handleUpdateProfile} className={styles.form}>
            <div className={styles.field}><label>Email</label><input type="email" value={user?.email || ''} disabled className={styles.disabledInput} /></div>
            <div className={styles.field}><label>Họ và tên</label><input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required className={styles.input} /></div>
            <div className={styles.field}><label>Ngày sinh (YYYY-MM-DD)</label><input type="text" placeholder="2000-01-01" value={dob} onChange={e => setDob(e.target.value)} className={styles.input} /></div>
            <div className={styles.field}><label>Số điện thoại</label><input type="text" value={phone} onChange={e => setPhone(e.target.value)} className={styles.input} /></div>
            <button type="submit" disabled={loading} className={styles.button}>{loading ? 'Đang lưu...' : 'Cập nhật'}</button>
          </form>
        )}
        {activeTab === 'password' && (
          <form onSubmit={handleChangePassword} className={styles.form}>
            <div className={styles.field}><label>Mật khẩu cũ</label><input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required className={styles.input} /></div>
            <div className={styles.field}><label>Mật khẩu mới</label><input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className={styles.input} /></div>
            <div className={styles.field}><label>Xác nhận mật khẩu mới</label><input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className={styles.input} /></div>
            <button type="submit" disabled={loading} className={styles.button}>{loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;