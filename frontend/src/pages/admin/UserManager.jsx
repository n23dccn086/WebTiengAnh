import { useEffect, useState } from 'react';
import apiClient from '../../services/apiClient';
import useAuthStore from '../../store/authStore';
import styles from './UserManager.module.css';

const UserManager = () => {
  const { user } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [search, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      const res = await apiClient.get(`/admin/users?${params.toString()}`);
      setUsers(res.data.data.users);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleBanUnban = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'BANNED' : 'ACTIVE';
    const confirmMsg = newStatus === 'BANNED' ? 'Khóa tài khoản này?' : 'Mở khóa tài khoản này?';
    if (!window.confirm(confirmMsg)) return;
    try {
      await apiClient.patch(`/admin/users/${userId}/status`, { status: newStatus });
      setSuccess(`Đã ${newStatus === 'BANNED' ? 'khóa' : 'mở khóa'} tài khoản`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Thao tác thất bại');
    }
  };

  const handleChangeRole = async (userId, newRole) => {
    if (!window.confirm(`Đổi role thành ${newRole}?`)) return;
    try {
      await apiClient.patch(`/admin/users/${userId}/role`, { role: newRole });
      setSuccess(`Đã đổi role thành ${newRole}`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Đổi role thất bại');
    }
  };

  if (loading) return <div className={styles.loading}>Đang tải...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>👥 Quản lý người dùng</h2>
        <button className={styles.backBtn} onClick={() => window.location.href = '/admin'}>← Quay lại Admin</button>
      </div>

      <div className={styles.filters}>
        <input type="text" placeholder="Tìm kiếm email hoặc tên..." value={search} onChange={e => setSearch(e.target.value)} className={styles.searchInput} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={styles.filterSelect}>
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang hoạt động</option>
          <option value="BANNED">Đã khóa</option>
          <option value="UNVERIFIED">Chưa xác thực</option>
        </select>
        <button onClick={fetchUsers} className={styles.refreshBtn}>🔄 Làm mới</button>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <div className={styles.table}>
        <table>
          <thead>
            <tr><th>ID</th><th>Email</th><th>Họ tên</th><th>Role</th><th>Trạng thái</th><th>Quota AI</th><th>Premium đến</th><th>Hành động</th></tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.email}</td>
                <td>{u.full_name}</td>
                <td>{u.role}</td>
                <td className={u.status === 'ACTIVE' ? styles.statusActive : styles.statusBanned}>{u.status}</td>
                <td>{u.ai_quota}</td>
                <td>{u.premium_until ? new Date(u.premium_until).toLocaleDateString() : '—'}</td>
                <td className={styles.actions}>
                  <button className={styles.btnBan} onClick={() => handleBanUnban(u.id, u.status)}>
                    {u.status === 'ACTIVE' ? '🔒 Khóa' : '🔓 Mở khóa'}
                  </button>
                  <select onChange={e => handleChangeRole(u.id, e.target.value)} value={u.role} className={styles.roleSelect}>
                    <option value="USER">USER</option>
                    <option value="PREMIUM">PREMIUM</option>
                    {user?.role === 'SUPER_ADMIN' && <option value="ADMIN">ADMIN</option>}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManager;