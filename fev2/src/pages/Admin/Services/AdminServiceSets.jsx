import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../../services/apiClient';
import './AdminServiceSets.css';
import './AdminServices.css'; 

const AdminServiceSets = () => {
  const { serviceId } = useParams(); 
  const navigate = useNavigate();
  
  const [serviceName, setServiceName] = useState(`Dịch vụ #${serviceId}`);
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ type: '', message: '', visible: false });

  // Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importData, setImportData] = useState({ title: '', description: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const showToast = (type, message) => {
    setToast({ type, message, visible: true });
    setTimeout(() => setToast({ visible: false }), 3000);
  };

  const fetchSets = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/admin/services/${serviceId}/sets`);
      setSets(res.data.data.sets || []);
      setServiceName(res.data.data.service_name || `Dịch vụ #${serviceId}`);
    } catch (error) {
      if (error.response?.status !== 404) {
         showToast('error', 'Lỗi khi tải danh sách bộ thẻ.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSets(); }, [serviceId]);

  const handleDelete = async (id) => {
    if (!window.confirm('CẢNH BÁO: Bạn có chắc chắn muốn xóa bộ thẻ này không?')) return;
    try {
      await apiClient.delete(`/admin/system-sets/${id}`);
      showToast('success', 'Đã xóa bộ thẻ thành công!');
      setSets(sets.filter(s => s.id !== id));
    } catch (error) {
      showToast('error', 'Lỗi khi xóa bộ thẻ.');
    }
  };

  // =====================================
  // LOGIC IMPORT EXCEL XỬ LÝ FILE + TEXT
  // =====================================
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleImportExcel = async () => {
    if (!importData.title.trim()) return showToast('error', 'Vui lòng nhập tên bộ thẻ!');
    if (!selectedFile) return showToast('error', 'Vui lòng chọn file Excel!');

    setIsSubmitting(true);
    
    // Gói dữ liệu vào FormData (chuẩn của multer bên Backend)
    const uploadData = new FormData();
    uploadData.append('title', importData.title);
    if (importData.description) {
      uploadData.append('description', importData.description);
    }
    uploadData.append('service_id', serviceId);
    uploadData.append('file', selectedFile);

    try {
      await apiClient.post('/admin/system-sets/import', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      showToast('success', 'Import file Excel và tạo bộ thẻ thành công!');
      setIsImportModalOpen(false);
      setImportData({ title: '', description: '' });
      setSelectedFile(null);
      fetchSets(); // Tải lại bảng để thấy dữ liệu mới
    } catch (error) {
      showToast('error', error.response?.data?.message || 'Lỗi định dạng file Excel.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-sets-container">
      {toast.visible && <div className={`toast-notification ${toast.type}`}><p>{toast.message}</p></div>}

      <div className="breadcrumb">
        <span className="breadcrumb-link" onClick={() => navigate('/admin/services')}>Dịch Vụ Học Tập</span>
        <span className="material-symbols-outlined breadcrumb-separator" style={{fontSize: '16px'}}>chevron_right</span>
        <span>Bộ Thẻ Của "{serviceName}"</span>
      </div>

      <div className="users-toolbar" style={{ justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '20px', margin: 0, color: 'var(--text-main)' }}>Quản Lý Bộ Thẻ</h2>
        <button className="btn-import-excel" onClick={() => { setSelectedFile(null); setIsImportModalOpen(true); }}>
          <span className="material-symbols-outlined">upload_file</span> Import Excel
        </button>
      </div>

      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: '10%' }}>ID</th>
              <th style={{ width: '25%' }}>Tên Bộ Thẻ</th>
              {/* Đã thêm cột Mô tả để cân đối bảng */}
              <th style={{ width: '35%' }}>Mô Tả</th>
              <th style={{ width: '15%' }}>Số Từ Vựng</th>
              <th style={{ textAlign: 'right', width: '15%' }}>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{textAlign: 'center', padding: '32px'}}>Đang tải dữ liệu...</td></tr>
            ) : sets.length === 0 ? (
              <tr><td colSpan="5" style={{textAlign: 'center', padding: '32px', color: 'var(--text-muted)'}}>Dịch vụ này chưa có bộ thẻ nào.</td></tr>
            ) : (
              sets.map(set => (
                <tr key={set.id}>
                  <td style={{ color: 'var(--text-muted)' }}>#{set.id}</td>
                  <td><strong style={{ fontSize: '15px' }}>{set.title}</strong></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{set.description || '...'}</td>
                  <td>
                    <span className="badge" style={{ background: 'var(--sidebar)', border: '1px solid var(--border-subtle)', color: 'var(--text-main)' }}>
                      {set.total_cards || 0} thẻ
                    </span>
                  </td>
                  <td style={{textAlign: 'right'}}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button className="btn-icon-action delete" title="Xóa Bộ Thẻ" onClick={() => handleDelete(set.id)}>
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

      {/* MODAL IMPORT EXCEL GỌN GÀNG */}
      {isImportModalOpen && (
        <div className="service-modal-overlay" onClick={() => setIsImportModalOpen(false)}>
          <div className="service-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Import Bộ Thẻ Hàng Loạt</h3>
              <button className="btn-icon-action" onClick={() => setIsImportModalOpen(false)}><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="modal-body">
              
              <div className="import-inputs">
                <div className="form-group">
                  <label>Tên bộ thẻ mới <span style={{color: 'var(--error)'}}>*</span></label>
                  <input type="text" className="modern-input" placeholder="VD: 1000 Từ vựng IELTS..." value={importData.title} onChange={e => setImportData({...importData, title: e.target.value})} autoFocus />
                </div>
                <div className="form-group">
                  <label>Mô tả ngắn</label>
                  <input type="text" className="modern-input" placeholder="Nhập mô tả cho bộ thẻ..." value={importData.description} onChange={e => setImportData({...importData, description: e.target.value})} />
                </div>
              </div>

              {!selectedFile ? (
                <>
                  <div className="upload-zone" onClick={() => fileInputRef.current.click()}>
                    <span className="material-symbols-outlined upload-icon">description</span>
                    <p className="upload-text">Nhấp để chọn file Excel</p>
                    <p className="upload-subtext">Hỗ trợ: .xlsx, .xls</p>
                    <input type="file" hidden accept=".xlsx, .xls" ref={fileInputRef} onChange={handleFileSelect} />
                  </div>
                  <div className="download-template-wrapper">
                    <a href="/template.xlsx" className="download-template-link" onClick={(e) => { e.preventDefault(); showToast('info', 'Bạn hãy tự tạo file mẫu theo định dạng cột nhé.'); }}>
                      Tải file Excel mẫu
                    </a>
                  </div>
                </>
              ) : (
                <div className="file-selected-box">
                  <div className="file-info">
                    <span className="material-symbols-outlined">task</span>
                    <div>
                      <p className="file-name">{selectedFile.name}</p>
                      <p className="file-size">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button className="btn-icon-action delete" onClick={() => setSelectedFile(null)}>
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              )}

            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setIsImportModalOpen(false)}>Hủy</button>
              <button 
                className="btn-submit" 
                style={{ background: selectedFile && importData.title ? 'linear-gradient(135deg, #10b981, #059669)' : 'var(--sidebar)' }} 
                disabled={!selectedFile || !importData.title || isSubmitting}
                onClick={handleImportExcel}
              >
                {isSubmitting ? 'Đang xử lý...' : 'Tiến Hành Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminServiceSets;