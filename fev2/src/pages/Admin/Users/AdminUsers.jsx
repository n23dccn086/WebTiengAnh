import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../../services/apiClient';
import './AdminUsers.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  
  // States cho Lọc & Tìm kiếm
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [toast, setToast] = useState({ type: '', message: '', visible: false });

  const showToast = (type, message) => {
    setToast({ type, message, visible: true });
    setTimeout(() => setToast({ type: '', message: '', visible: false }), 3000);
  };

  // Kỹ thuật Debounce
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchUsers = useCallback(async (pageToFetch = 1) => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/users', {
        params: { page: pageToFetch, limit: 10, search: debouncedSearch, status: statusFilter }
      });
      setUsers(res.data.data.users);
      setPagination(res.data.data.pagination);
    } catch (error) {
      showToast('error', 'Không thể tải danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchUsers(1); 
  }, [fetchUsers]);

  const toggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'BANNED' ? 'ACTIVE' : 'BANNED';
    try {
      await apiClient.patch(`/admin/users/${userId}/status`, { status: newStatus });
      showToast('success', `Đã ${newStatus === 'BANNED' ? 'khóa' : 'mở khóa'} tài khoản!`);
      setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } catch (error) {
      showToast('error', error.response?.data?.message || 'Lỗi cập nhật trạng thái.');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await apiClient.patch(`/admin/users/${userId}/role`, { role: newRole });
      showToast('success', 'Cập nhật phân quyền thành công!');
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      showToast('error', error.response?.data?.message || 'Lỗi cập nhật phân quyền.');
    }
  };

  const getInitials = (name) => name ? name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="admin-users-container">
      {toast.visible && <div className={`toast-notification ${toast.type}`}><p>{toast.message}</p></div>}
      
      {/* TOOLBAR */}
      <div className="users-toolbar">
        <div className="toolbar-search">
          <span className="material-symbols-outlined search-icon">search</span>
          <input 
            type="text" 
            placeholder="Tìm theo tên, email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="toolbar-filters">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Hoạt động (Active)</option>
            <option value="BANNED">Bị khóa (Banned)</option>
            <option value="UNVERIFIED">Chưa xác thực</option>
          </select>
        </div>
      </div>

      {/* MODERN TABLE */}
      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Người Dùng</th>
              <th>Phân Quyền</th>
              <th>Trạng Thái</th>
              {/* Đã xóa cột AI Quota */}
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" style={{textAlign: 'center', padding: '40px 0'}}>Đang đồng bộ dữ liệu...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="4" style={{textAlign: 'center', padding: '40px 0'}}>Không tìm thấy kết quả phù hợp.</td></tr>
            ) : (
              users.map(u => (
                <tr key={u.id}>
                  {/* Cột 1: Thông tin người dùng */}
                  <td>
                    <div className="td-user-info">
                      <div className="user-avatar-mini">{getInitials(u.full_name)}</div>
                      <div className="user-name-block">
                        <span className="user-fullname">{u.full_name}</span>
                        <span className="user-email-text">{u.email}</span>
                      </div>
                    </div>
                  </td>
                  
                  {/* Cột 2: Phân quyền */}
                  <td>
                    <span className={`badge role-${u.role?.toLowerCase()}`}>
                      {u.role}
                    </span>
                  </td>
                  
                  {/* Cột 3: Trạng thái */}
                  <td>
                    <span className={`badge status-${u.status?.toLowerCase()}`}>
                      {u.status === 'ACTIVE' ? 'Hoạt động' : u.status === 'BANNED' ? 'Bị khóa' : 'Chưa xác thực'}
                    </span>
                  </td>
                  
                  {/* Cột 4: Hành động */}
                  <td>
                    <div className="td-actions">
                      {/* Dropdown Đổi Role cực mượt */}
                      <div className="select-role-wrapper">
                        <select 
                          className="select-role" 
                          value={u.role} 
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          disabled={u.role === 'SUPER_ADMIN'}
                        >
                          <option value="USER">Học viên</option>
                          <option value="PREMIUM">Premium</option>
                          <option value="ADMIN">Quản trị viên</option>
                        </select>
                        <span className="material-symbols-outlined">expand_more</span>
                      </div>

                      {/* Nút Ban/Unban sang trọng có Icon */}
                      {u.role !== 'SUPER_ADMIN' && (
                        <button 
                          className={`btn-action ${u.status === 'BANNED' ? 'unban' : 'ban'}`}
                          onClick={() => toggleUserStatus(u.id, u.status)}
                        >
                          <span className="material-symbols-outlined">
                            {u.status === 'BANNED' ? 'lock_open' : 'lock'}
                          </span>
                          {u.status === 'BANNED' ? 'Mở Khóa' : 'Khóa User'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* PAGINATION */}
        {!loading && users.length > 0 && (
          <div className="pagination-controls">
            <div className="pagination-info">
              Trang {pagination.page} / {pagination.totalPages} • Tổng cộng {pagination.total} người dùng
            </div>
            <div className="pagination-buttons">
              <button 
                className="btn-page" 
                disabled={pagination.page === 1}
                onClick={() => fetchUsers(pagination.page - 1)}
              >
                <span className="material-symbols-outlined" style={{fontSize: '16px'}}>chevron_left</span> Trước
              </button>
              <button 
                className="btn-page" 
                disabled={pagination.page === pagination.totalPages}
                onClick={() => fetchUsers(pagination.page + 1)}
              >
                Sau <span className="material-symbols-outlined" style={{fontSize: '16px'}}>chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;