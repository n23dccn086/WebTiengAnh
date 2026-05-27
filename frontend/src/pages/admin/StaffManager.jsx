import { useEffect, useState } from 'react';
import apiClient from '../../services/apiClient';
import useAuthStore from '../../store/authStore';
import styles from './StaffManager.module.css';

const StaffManager = () => {
  const { user } = useAuthStore();
  
  // Chỉ SUPER_ADMIN mới được xem
  if (user?.role !== 'SUPER_ADMIN') {
    return <div className={styles.container}><div className={styles.error}>Bạn không có quyền truy cập trang này.</div></div>;
  }

  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ email: '', full_name: '', password: '' });

  useEffect(() => {
    fetchStaffs();
  }, []);

  const fetchStaffs = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/admin/users');
      const admins = res.data.data.users.filter(u => u.role === 'ADMIN');
      setStaffs(admins);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách Admin');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await apiClient.post('/super-admin/staff', formData);
      setSuccess('Thêm Admin thành công');
      setFormData({ email: '', full_name: '', password: '' });
      setShowForm(false);
      fetchStaffs();
    } catch (err) {
      setError(err.response?.data?.message || 'Tạo Admin thất bại');
    }
  };

  const handleDelete = async (staffId) => {
    if (staffId === user.id) {
      setError('Bạn không thể tự xóa chính mình');
      return;
    }
    if (!window.confirm('Xóa tài khoản Admin này?')) return;
    try {
      await apiClient.delete(`/super-admin/staff/${staffId}`);
      setSuccess('Xóa Admin thành công');
      fetchStaffs();
    } catch (err) {
      setError(err.response?.data?.message || 'Xóa thất bại');
    }
  };

  const handleResetPassword = async (staffId) => {
    const newPassword = prompt('Nhập mật khẩu mới cho Admin này:', 'Admin123!');
    if (!newPassword) return;
    try {
      await apiClient.put(`/super-admin/staff/${staffId}/password`, { new_password: newPassword });
      setSuccess('Đặt lại mật khẩu thành công');
    } catch (err) {
      setError(err.response?.data?.message || 'Reset mật khẩu thất bại');
    }
  };

  if (loading) return <div className={styles.loading}>Đang tải...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>👨‍💼 Quản lý Admin (Nhân sự)</h2>
        <button className={styles.backBtn} onClick={() => window.location.href = '/admin'}>← Quay lại Admin</button>
        <button className={styles.addBtn} onClick={() => setShowForm(!showForm)}>+ Thêm Admin mới</button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className={styles.form}>
          <h3>Thêm tài khoản Admin</h3>
          <div className={styles.field}>
            <label>Email *</label>
            <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
          </div>
          <div className={styles.field}>
            <label>Họ và tên *</label>
            <input type="text" value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} required />
          </div>
          <div className={styles.field}>
            <label>Mật khẩu tạm *</label>
            <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
          </div>
          <div className={styles.buttonGroup}>
            <button type="submit" className={styles.btnPrimary}>Tạo Admin</button>
            <button type="button" className={styles.btnCancel} onClick={() => setShowForm(false)}>Hủy</button>
          </div>
        </form>
      )}

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <div className={styles.table}>
        <table>
          <thead>
            <tr><th>ID</th><th>Email</th><th>Họ tên</th><th>Trạng thái</th><th>Hành động</th></tr>
          </thead>
          <tbody>
            {staffs.map(staff => (
              <tr key={staff.id}>
                <td>{staff.id}</td>
                <td>{staff.email}</td>
                <td>{staff.full_name}</td>
                <td>{staff.status}</td>
                <td className={styles.actions}>
                  <button className={styles.btnReset} onClick={() => handleResetPassword(staff.id)}>🔑 Reset pass</button>
                  <button className={styles.btnDelete} onClick={() => handleDelete(staff.id)}>🗑️ Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StaffManager;