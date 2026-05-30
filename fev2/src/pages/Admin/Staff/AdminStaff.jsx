import React, { useState, useEffect } from 'react';
import apiClient from '../../../services/apiClient';
import '../Users/AdminUsers.css'; 
import '../Services/AdminServices.css'; 
import './AdminStaff.css';

const AdminStaff = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ type: '', message: '', visible: false });

  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isResetPassModalOpen, setIsResetPassModalOpen] = useState(false);
  
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({ email: '', full_name: '', password: '' });
  const [newPassword, setNewPassword] = useState('');

  const showToast = (type, message) => {
    setToast({ type, message, visible: true });
    setTimeout(() => setToast({ visible: false }), 3000);
  };

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/super-admin/staff');
      setStaffList(res.data.data || []);
    } catch (error) {
      if (error.response?.status === 404) {
        showToast('error', 'Backend chưa có API GET /super-admin/staff');
      } else {
        showToast('error', 'Lỗi khi tải danh sách. Có thể bạn không phải Super Admin.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCreateStaff = async () => {
    if (!formData.email || !formData.full_name || !formData.password) {
      return showToast('error', 'Vui lòng điền đầy đủ thông tin!');
    }
    setIsSubmitting(true);
    try {
      await apiClient.post('/super-admin/staff', formData);
      showToast('success', 'Tạo tài khoản Admin thành công!');
      setIsCreateModalOpen(false);
      setFormData({ email: '', full_name: '', password: '' });
      fetchStaff();
    } catch (error) {
      showToast('error', error.response?.data?.message || 'Lỗi khi tạo tài khoản.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      return showToast('error', 'Mật khẩu phải có ít nhất 6 ký tự!');
    }
    setIsSubmitting(true);
    try {
      await apiClient.put(`/super-admin/staff/${selectedStaff.id}/password`, { new_password: newPassword });
      showToast('success', `Đã đặt lại mật khẩu cho ${selectedStaff.full_name}!`);
      setIsResetPassModalOpen(false);
      setNewPassword('');
    } catch (error) {
      showToast('error', error.response?.data?.message || 'Lỗi đặt lại mật khẩu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStaff = async (staff) => {
    if (staff.role === 'SUPER_ADMIN') {
      return showToast('error', 'Không thể xóa tài khoản SUPER_ADMIN!');
    }
    if (!window.confirm(`Bạn có chắc chắn muốn XÓA VĨNH VIỄN nhân sự ${staff.full_name}?`)) return;
    
    try {
      await apiClient.delete(`/super-admin/staff/${staff.id}`);
      showToast('success', 'Đã xóa tài khoản Admin thành công!');
      setStaffList(staffList.filter(s => s.id !== staff.id));
    } catch (error) {
      showToast('error', 'Lỗi khi xóa tài khoản.');
    }
  };

  const getInitials = (name) => name ? name.charAt(0).toUpperCase() : 'A';

  return (
    <div className="admin-staff-container">
      {toast.visible && <div className={`toast-notification ${toast.type}`}><p>{toast.message}</p></div>}

      <div className="users-toolbar" style={{ justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '20px', margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{color: '#3b82f6'}}>admin_panel_settings</span>
            Quản Lý Nhân Sự (Staff)
          </h2>
          <p style={{ margin: '4px 0 0 32px', fontSize: '13px', color: 'var(--text-muted)' }}>Khu vực đặc quyền của Super Admin</p>
        </div>
        <button className="btn-create-staff" onClick={() => setIsCreateModalOpen(true)}>
          <span className="material-symbols-outlined">person_add</span> Thêm Quản Trị Viên
        </button>
      </div>

      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nhân Viên</th>
              <th>Chức Vụ</th>
              <th style={{textAlign: 'center'}}>Trạng Thái</th>
              <th style={{textAlign: 'right'}}>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" style={{textAlign: 'center', padding: '32px'}}>Đang tải dữ liệu...</td></tr>
            ) : staffList.length === 0 ? (
              <tr><td colSpan="4" style={{textAlign: 'center', padding: '32px', color: 'var(--text-muted)'}}>Chưa có nhân sự nào.</td></tr>
            ) : (
              staffList.map(staff => (
                <tr key={staff.id}>
                  <td>
                    <div className="td-user-info">
                      <div className="staff-avatar">{getInitials(staff.full_name)}</div>
                      <div className="user-name-block">
                        <span className="user-fullname">{staff.full_name}</span>
                        <span className="user-email-text">{staff.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`staff-role-badge ${staff.role === 'SUPER_ADMIN' ? 'staff-role-super' : 'staff-role-admin'}`}>
                      {staff.role}
                    </span>
                  </td>
                  <td style={{textAlign: 'center'}}>
                    <span className={`badge status-${staff.status?.toLowerCase() || 'active'}`}>
                      {staff.status || 'ACTIVE'}
                    </span>
                  </td>
                  <td style={{textAlign: 'right'}}>
                    {staff.role !== 'SUPER_ADMIN' ? (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button 
                          className="btn-icon-action edit" 
                          title="Đặt lại mật khẩu"
                          onClick={() => { setSelectedStaff(staff); setIsResetPassModalOpen(true); }}
                        >
                          <span className="material-symbols-outlined">key</span>
                        </button>
                        <button 
                          className="btn-icon-action delete" 
                          title="Thu hồi quyền / Xóa"
                          onClick={() => handleDeleteStaff(staff)}
                        >
                          <span className="material-symbols-outlined">person_remove</span>
                        </button>
                      </div>
                    ) : (
                      <span style={{color: 'var(--text-muted)', fontSize: '12px'}}>Không thể thao tác</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL THÊM STAFF */}
      {isCreateModalOpen && (
        <div className="service-modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="service-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tạo Tài Khoản Quản Trị</h3>
              <button className="btn-icon-action" onClick={() => setIsCreateModalOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Họ và Tên <span style={{color: 'var(--error)'}}>*</span></label>
                <input className="modern-input" type="text" placeholder="VD: Nguyễn Văn A" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} autoFocus />
              </div>
              <div className="form-group" style={{marginTop: '16px'}}>
                <label>Email <span style={{color: 'var(--error)'}}>*</span></label>
                <input className="modern-input" type="email" placeholder="admin@domain.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div className="form-group" style={{marginTop: '16px'}}>
                <label>Mật khẩu khởi tạo <span style={{color: 'var(--error)'}}>*</span></label>
                <input className="modern-input" type="text" placeholder="Tối thiểu 6 ký tự" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
            </div>
            <div className="modal-footer" style={{marginTop: '24px'}}>
              <button className="btn-cancel" onClick={() => setIsCreateModalOpen(false)} disabled={isSubmitting}>Hủy</button>
              <button className="btn-submit" style={{background: 'var(--accent)', color: 'white'}} onClick={handleCreateStaff} disabled={isSubmitting}>
                {isSubmitting ? 'Đang tạo...' : 'Tạo Tài Khoản'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RESET PASSWORD */}
      {isResetPassModalOpen && (
        <div className="service-modal-overlay" onClick={() => setIsResetPassModalOpen(false)}>
          <div className="service-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Cấp lại Mật Khẩu</h3>
              <button className="btn-icon-action" onClick={() => setIsResetPassModalOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-body">
              <p style={{fontSize: '14px', color: 'var(--text-muted)', margin: '0 0 16px 0', lineHeight: '1.5'}}>
                Bạn đang cấp lại mật khẩu bảo mật cho nhân sự: <strong style={{color: 'white'}}>{selectedStaff?.full_name}</strong>
              </p>
              <div className="form-group">
                <label>Mật khẩu mới <span style={{color: 'var(--error)'}}>*</span></label>
                <input 
                  type="text" 
                  className="input-reset-pass"
                  placeholder="Nhập mật khẩu..." 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  autoFocus 
                />
              </div>
            </div>
            <div className="modal-footer" style={{marginTop: '24px'}}>
              <button className="btn-cancel" onClick={() => setIsResetPassModalOpen(false)} disabled={isSubmitting}>Hủy</button>
              <button className="btn-submit" style={{background: 'var(--accent)', color: 'white'}} onClick={handleResetPassword} disabled={isSubmitting}>
                {isSubmitting ? 'Đang lưu...' : 'Lưu Mật Khẩu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStaff;