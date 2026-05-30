import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../../services/apiClient';
import './AdminServiceSets.css';
import './AdminServices.css'; // Mượn lại CSS bảng & nút của trang Service cho đồng bộ

const AdminServiceSets = () => {
  const { serviceId } = useParams(); // Lấy ID dịch vụ từ URL (VD: số 1)
  const navigate = useNavigate();
  
  const [serviceName, setServiceName] = useState(`Dịch vụ #${serviceId}`);
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ type: '', message: '', visible: false });

  // Modal State cho Thêm Bộ thẻ
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (type, message) => {
    setToast({ type, message, visible: true });
    setTimeout(() => setToast({ visible: false }), 3000);
  };

  // 1. Fetch dữ liệu bộ thẻ của Dịch vụ này
  const fetchSets = async () => {
    setLoading(true);
    try {
      // ⚠️ CẦN BACKEND HỖ TRỢ API NÀY: GET /api/v1/admin/services/:id/sets
      // Tạm thời có thể nó sẽ báo lỗi 404 nếu BE chưa viết, nhưng giao diện vẫn sẽ lên.
      const res = await apiClient.get(`/admin/services/${serviceId}/sets`);
      setSets(res.data.data.sets || []);
      setServiceName(res.data.data.service_name || `Dịch vụ #${serviceId}`);
    } catch (error) {
      if (error.response?.status === 404) {
         showToast('error', 'Chưa có API lấy danh sách bộ thẻ cho dịch vụ này (Backend cần bổ sung).');
      } else {
         showToast('error', 'Lỗi khi tải danh sách bộ thẻ.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSets();
  }, [serviceId]);

  // Xử lý Modal Thêm mới
  const handleSaveSet = async () => {
    if (!formData.title.trim()) return showToast('error', 'Vui lòng nhập tên bộ thẻ');
    setIsSubmitting(true);
    try {
      // Gọi API tạo bộ thẻ hệ thống (API 8 của bạn)
      // Chú ý: Ở đây tạm truyền mảng flashcards rỗng, sau này bạn sẽ có trang add từ vựng riêng
      await apiClient.post('/admin/system-sets', {
        title: formData.title,
        description: formData.description,
        service_id: Number(serviceId),
        flashcards: [{ word: "Sample", meaning: "Mẫu (Vui lòng sửa)", question_type: "WORD_TO_MEANING" }] // Dummy data pass validate
      });
      showToast('success', 'Tạo bộ thẻ thành công!');
      setIsModalOpen(false);
      setFormData({ title: '', description: '' });
      fetchSets(); // Load lại list
    } catch (error) {
      showToast('error', error.response?.data?.message || 'Có lỗi xảy ra.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-sets-container">
      {toast.visible && <div className={`toast-notification ${toast.type}`}><p>{toast.message}</p></div>}

      {/* THANH ĐIỀU HƯỚNG QUAY LẠI */}
      <div className="breadcrumb">
        <span className="breadcrumb-link" onClick={() => navigate('/admin/services')}>
          Dịch Vụ Học Tập
        </span>
        <span className="material-symbols-outlined breadcrumb-separator" style={{fontSize: '16px'}}>chevron_right</span>
        <span>Bộ Thẻ Của "{serviceName}"</span>
      </div>

      {/* TOOLBAR */}
      <div className="users-toolbar" style={{ justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '20px', margin: 0, color: 'var(--text-main)' }}>Quản Lý Bộ Thẻ Hệ Thống</h2>
        <button className="btn-create-service" onClick={() => setIsModalOpen(true)}>
          <span className="material-symbols-outlined">add_circle</span> Thêm Bộ Thẻ Mới
        </button>
      </div>

      {/* TABLE */}
      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th style={{ width: '30%' }}>Tên Bộ Thẻ</th>
              <th style={{ width: '30%' }}>Số lượng từ</th>
              <th style={{ textAlign: 'center' }}>Hiển Thị</th>
              <th style={{ textAlign: 'right' }}>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{textAlign: 'center', padding: '32px'}}>Đang tải dữ liệu...</td></tr>
            ) : sets.length === 0 ? (
              <tr>
                <td colSpan="5" style={{textAlign: 'center', padding: '32px', color: 'var(--text-muted)'}}>
                  Dịch vụ này chưa có bộ thẻ nào. Hãy tạo bộ thẻ đầu tiên!
                  <br />
                  <span style={{fontSize: '12px', opacity: 0.7}}>(Hoặc do Backend chưa có API GET /services/{serviceId}/sets)</span>
                </td>
              </tr>
            ) : (
              sets.map(set => (
                <tr key={set.id}>
                  <td style={{ color: 'var(--text-muted)' }}>#{set.id}</td>
                  <td><strong>{set.title}</strong></td>
                  <td style={{ color: 'var(--text-muted)' }}>{set.total_cards || 0} thẻ</td>
                  
                  {/* Cột Ẩn hiện (Đã chuẩn bị sẵn UI cho bạn thêm sau) */}
                  <td style={{textAlign: 'center'}}>
                     <label className="toggle-switch">
                      <input type="checkbox" checked={set.status !== 'HIDDEN'} readOnly />
                      <span className="toggle-slider"></span>
                    </label>
                  </td>

                  <td style={{textAlign: 'right'}}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      <button className="btn-view-sets" style={{ backgroundColor: 'transparent', border: '1px solid var(--accent)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit_document</span>
                        Sửa Từ Vựng
                      </button>
                      <button className="btn-icon-action delete" title="Xóa">
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

      {/* MODAL THÊM BỘ THẺ */}
      {isModalOpen && (
        <div className="service-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="service-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Tạo Bộ Thẻ Mới</h3>
              <button className="btn-icon-action" onClick={() => setIsModalOpen(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Tên bộ thẻ <span style={{color: 'var(--error)'}}>*</span></label>
                <input 
                  type="text" 
                  placeholder="VD: TOEIC Part 1, 3000 Từ vựng cơ bản..."
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Mô tả (Không bắt buộc)</label>
                <textarea 
                  placeholder="Giới thiệu về bộ thẻ này..."
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                ></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Hủy</button>
              <button className="btn-submit" onClick={handleSaveSet} disabled={isSubmitting}>
                {isSubmitting ? 'Đang tạo...' : 'Tạo Bộ Thẻ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminServiceSets;