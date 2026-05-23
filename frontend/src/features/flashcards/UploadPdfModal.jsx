import { useState } from 'react';
import apiClient from '../../services/apiClient';
import styles from './UploadPdfModal.module.css';

const UploadPdfModal = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [serviceId, setServiceId] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title.trim()) {
      setError('Vui lòng chọn file và nhập tiêu đề');
      return;
    }
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('set_title', title);
    formData.append('service_id', serviceId);

    try {
      const res = await apiClient.post('/flashcard-sets/pdf-extract', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (onSuccess) onSuccess(res.data.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi xử lý PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3>Tạo bộ thẻ từ PDF</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label>Tiêu đề bộ thẻ *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className={styles.field}>
            <label>Danh mục</label>
            <select value={serviceId} onChange={(e) => setServiceId(Number(e.target.value))}>
              <option value={1}>Từ vựng cơ bản</option>
              <option value={2}>TOEIC</option>
              <option value={3}>IELTS</option>
              <option value={4}>Grammar</option>
              <option value={5}>Từ vựng nâng cao</option>
              <option value={6}>Tài liệu cá nhân</option>
            </select>
          </div>
          <div className={styles.field}>
            <label>File PDF *</label>
            <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files[0])} required />
          </div>
          {error && <div className={styles.error}>{error}</div>}
          <div className={styles.actions}>
            <button type="button" onClick={onClose}>Hủy</button>
            <button type="submit" disabled={loading}>{loading ? 'Đang xử lý...' : 'Tạo bộ thẻ'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadPdfModal;