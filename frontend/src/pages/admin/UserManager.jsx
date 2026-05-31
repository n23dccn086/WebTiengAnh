import { useEffect, useState } from 'react';
import apiClient from '../../services/apiClient';
import useAuthStore from '../../store/authStore';
import useDebounce from '../../hooks/useDebounce';
import styles from './UserManager.module.css';

const UserManager = () => {
  const { user } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 20;

  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    fetchUsers();
  }, [debouncedSearch, statusFilter, roleFilter, page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (statusFilter) params.append('status', statusFilter);
      if (roleFilter) params.append('role', roleFilter);
      params.append('page', page);
      params.append('limit', limit);
      const res = await apiClient.get(`/admin/users?${params.toString()}`);
      setUsers(res.data.data.users);
      setTotalPages(res.data.data.pagination.totalPages);
      setTotalItems(res.data.data.pagination.total);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleBanUnban = async (userId, currentStatus, targetRole) => {
    if (userId === user.id) {
      setError('Bạn không thể khóa hoặc mở khóa chính mình');
      return;
    }
    if (user.role === 'ADMIN' && (targetRole === 'ADMIN' || targetRole === 'SUPER_ADMIN')) {
      setError('Bạn không thể khóa hoặc mở khóa admin hoặc super admin');
      return;
    }
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

  const handleChangeRole = async (userId, newRole, currentRole) => {
    if (userId === user.id) {
      setError('Bạn không thể thay đổi role của chính mình');
      return;
    }
    if (user.role === 'ADMIN' && !['USER', 'PREMIUM'].includes(newRole)) {
      setError('Bạn chỉ có thể đổi role giữa USER và PREMIUM');
      return;
    }
    if (user.role === 'ADMIN' && (currentRole === 'ADMIN' || currentRole === 'SUPER_ADMIN')) {
      setError('Bạn không thể thay đổi role của admin hoặc super admin');
      return;
    }
    if (!window.confirm(`Đổi role từ ${currentRole} thành ${newRole}?`)) return;
    try {
      await apiClient.patch(`/admin/users/${userId}/role`, { role: newRole });
      setSuccess(`Đã đổi role thành ${newRole}`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Đổi role thất bại');
    }
  };

  const canBan = (targetUser) => {
    if (targetUser.id === user.id) return false;
    if (user.role === 'ADMIN' && (targetUser.role === 'ADMIN' || targetUser.role === 'SUPER_ADMIN')) return false;
    return true;
  };

  const canChangeRole = (targetUser) => {
    if (targetUser.id === user.id) return false;
    if (user.role === 'ADMIN') {
      return (targetUser.role === 'USER' || targetUser.role === 'PREMIUM');
    }
    if (user.role === 'SUPER_ADMIN') return true;
    return false;
  };

  if (loading) return <div className={styles.loading}>Đang tải...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>👥 Quản lý người dùng</h2>
        <button className={styles.backBtn} onClick={() => window.location.href = '/admin'}>← Quay lại Admin</button>
      </div>

      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Tìm kiếm email hoặc tên..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang hoạt động</option>
          <option value="BANNED">Đã khóa</option>
          <option value="UNVERIFIED">Chưa xác thực</option>
        </select>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">Tất cả role</option>
          <option value="USER">USER</option>
          <option value="PREMIUM">PREMIUM</option>
          <option value="ADMIN">ADMIN</option>
          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
        </select>
        <button onClick={fetchUsers} className={styles.refreshBtn}>🔄 Làm mới</button>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Họ tên</th>
              <th>Role</th>
              <th>Trạng thái</th>
              <th>Quota AI</th>
              <th>Premium đến</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.email}</td>
                <td>{u.full_name}</td>
                <td>{u.role}</td>
                <td className={u.status === 'ACTIVE' ? styles.statusActive : styles.statusBanned}>
                  {u.status}
                </td>
                <td>{u.ai_quota}</td>
                <td>{u.premium_until ? new Date(u.premium_until).toLocaleDateString() : '—'}</td>
                <td className={styles.actions}>
                  {canBan(u) && (
                    <button
                      className={styles.btnBan}
                      onClick={() => handleBanUnban(u.id, u.status, u.role)}
                    >
                      {u.status === 'ACTIVE' ? '🔒 Khóa' : '🔓 Mở khóa'}
                    </button>
                  )}
                  {canChangeRole(u) ? (
                    <select
                      onChange={(e) => handleChangeRole(u.id, e.target.value, u.role)}
                      value={u.role}
                      className={styles.roleSelect}
                    >
                      <option value="USER">USER</option>
                      <option value="PREMIUM">PREMIUM</option>
                      {user.role === 'SUPER_ADMIN' && <option value="ADMIN">ADMIN</option>}
                      {user.role === 'SUPER_ADMIN' && <option value="SUPER_ADMIN">SUPER_ADMIN</option>}
                    </select>
                  ) : (
                    <span className={styles.roleText}>{u.role}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className={styles.pageBtn}>◀ Trước</button>
          <span className={styles.pageInfo}>Trang {page} / {totalPages} (Tổng {totalItems} người dùng)</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className={styles.pageBtn}>Sau ▶</button>
        </div>
      )}
    </div>
  );
};

export default UserManager;