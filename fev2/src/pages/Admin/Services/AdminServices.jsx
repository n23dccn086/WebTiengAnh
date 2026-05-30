import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../../services/apiClient';
import './AdminServices.css';

const AdminServices = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ type: '', message: '', visible: false });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); 
  const [formData, setFormData] = useState({ title: '', description: '', status: 'VISIBLE' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (type, message) => {
    setToast({ type, message, visible: true });
    setTimeout(() => setToast({ visible: false }), 3000);
  };

  // 1. Lấy danh sách dịch vụ
  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/services');
      setServices(res.data.data || []);
    } catch (error) {
      showToast('error', 'Không thể tải danh sách dịch vụ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Xử lý Modal
  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ title: '', description: '', status: 'VISIBLE' });
    setIsModalOpen(true);
  };

  const openEditModal = (service) => {
    setEditingId(service.id);
    setFormData({ title: service.title, description: service.description || '', status: service.status });
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  // 2. Lưu Dịch Vụ (POST / PUT)
  const handleSaveService = async () => {
    if (!formData.title.trim()) return showToast('error', 'Vui lòng nhập tên dịch vụ');
    setIsSubmitting(true);
    try {
      if (editingId) {
        await apiClient.put(`/admin/services/${editingId}`, formData);
        showToast('success', 'Cập nhật dịch vụ thành công!');
      } else {
        await apiClient.post('/admin/services', formData);
        showToast('success', 'Tạo dịch vụ mới thành công!');
      }
      closeModal();
      fetchServices(); // Tải lại danh sách
    } catch (error) {
      showToast('error', error.response?.data?.message || 'Có lỗi xảy ra khi lưu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Toggle Ẩn/Hiện (PATCH)
  const handleToggleStatus = async (service) => {
    const newStatus = service.status === 'VISIBLE' ? 'HIDDEN' : 'VISIBLE';
    // Đảo state UI trước cho mượt (Optimistic Update)
    setServices(services.map(s => s.id === service.id ? { ...s, status: newStatus } : s));
    
    try {
      // Gọi API cập nhật ngầm
      await apiClient.patch(`/admin/services/${service.id}/status`, { status: newStatus });
      showToast('success', `Đã ${newStatus === 'VISIBLE' ? 'hiển thị' : 'ẩn'} dịch vụ!`);
    } catch (error) {
      // Nếu API lỗi, đảo ngược lại UI
      setServices(services.map(s => s.id === service.id ? { ...s, status: service.status } : s));
      showToast('error', 'Không thể thay đổi trạng thái.');
    }
  };

  // 4. Xóa Dịch vụ (DELETE)
  const handleDelete = async (id) => {
    if (!window.confirm('CẢNH BÁO: Xóa dịch vụ sẽ xóa luôn toàn bộ Bộ thẻ và Flashcard bên trong. Bạn chắc chắn chứ?')) return;
    try {
      await apiClient.delete(`/admin/services/${id}`);
      showToast('success', 'Đã xóa dịch vụ vĩnh viễn!');
      setServices(services.filter(s => s.id !== id));
    } catch (error) {
      showToast('error', 'Lỗi khi xóa dịch vụ.');
    }
  };

  return (
    <div className="admin-services-container">
      {toast.visible && <div className={`toast-notification ${toast.type}`}><p>{toast.message}</p></div>}

      {/* TOOLBAR */}
      <div className="users-toolbar" style={{ justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '20px', margin: 0, color: 'var(--text-main)' }}>Dịch Vụ Học Tập</h2>
        <button className="btn-create-service" onClick={openCreateModal}>
          <span className="material-symbols-outlined">add_circle</span> Thêm Dịch Vụ
        </button>
      </div>

      {/* TABLE */}
      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th style={{ width: '25%' }}>Tên Dịch Vụ</th>
              <th style={{ width: '30%' }}>Mô Tả</th>
              <th style={{ textAlign: 'center' }}>Hiển Thị</th>
              <th style={{ textAlign: 'center' }}>Bộ Thẻ</th>
              <th style={{ textAlign: 'right' }}>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{textAlign: 'center', padding: '32px'}}>Đang tải dữ liệu...</td></tr>
            ) : services.length === 0 ? (
              <tr><td colSpan="6" style={{textAlign: 'center', padding: '32px', color: 'var(--text-muted)'}}>Chưa có dịch vụ nào trong hệ thống.</td></tr>
            ) : (
              services.map(s => (
                <tr key={s.id} style={{ opacity: s.status === 'HIDDEN' ? 0.6 : 1, transition: 'opacity 0.3s' }}>
                  <td style={{ color: 'var(--text-muted)' }}>#{s.id}</td>
                  <td><strong style={{ fontSize: '15px' }}>{s.title}</strong></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{s.description || 'Không có mô tả'}</td>
                  
                  {/* Cột Công tắc Ẩn Hiện */}
                  <td style={{textAlign: 'center'}}>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={s.status === 'VISIBLE'} 
                        onChange={() => handleToggleStatus(s)} 
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </td>

                  {/* Cột Nút Xem Bộ thẻ */}
                  <td style={{textAlign: 'center'}}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <button 
                        className="btn-view-sets" 
                        onClick={() => navigate(`/admin/services/${s.id}/sets`)}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>library_books</span>
                        Quản lý Bộ thẻ
                      </button>
                    </div>
                  </td>

                  {/* Cột Thao tác (Sửa/Xóa) */}
                  <td style={{textAlign: 'right'}}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                      <button className="btn-icon-action edit" onClick={() => openEditModal(s)} title="Sửa">
                        <span className="material-symbols-outlined">edit_square</span>
                      </button>
                      <button className="btn-icon-action delete" onClick={() => handleDelete(s.id)} title="Xóa">
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL THÊM/SỬA */}
      {isModalOpen && (
        <div className="service-modal-overlay" onClick={closeModal}>
          <div className="service-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId ? 'Chỉnh Sửa Dịch Vụ' : 'Tạo Dịch Vụ Mới'}</h3>
              <button className="btn-icon-action" onClick={closeModal}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Tên dịch vụ <span style={{color: 'var(--error)'}}>*</span></label>
                <input 
                  type="text" 
                  placeholder="VD: TOEIC, IELTS, Tiếng Anh Giao Tiếp..."
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Mô tả ngắn</label>
                <textarea 
                  placeholder="Mô tả cho dịch vụ này..."
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                ></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeModal} disabled={isSubmitting}>Hủy</button>
              <button className="btn-submit" onClick={handleSaveService} disabled={isSubmitting}>
                {isSubmitting ? 'Đang lưu...' : 'Lưu Dịch Vụ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminServices;