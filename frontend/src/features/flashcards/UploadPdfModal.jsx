import { useState } from 'react';
import apiClient from '../../services/apiClient';
import styles from './UploadPdfModal.module.css';

const UploadPdfModal = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type !== 'application/pdf') {
      setError('Chỉ chấp nhận file PDF. Vui lòng chọn file có đuôi .pdf');
      setFile(null);
      e.target.value = '';
    } else {
      setError('');
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title.trim()) {
      setError('Vui lòng chọn file PDF và nhập tên bộ thẻ.');
      return;
    }
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    if (description.trim()) formData.append('description', description.trim());

    try {
      const res = await apiClient.post('/flashcard-sets/pdf-extract', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (onSuccess) onSuccess(res.data.data);
      onClose();
    } catch (err) {
      console.error('Upload error:', err);
      const msg = err.response?.data?.message || err.message || 'Có lỗi xảy ra khi xử lý PDF';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3>📄 Tạo bộ thẻ từ PDF</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label>Tên bộ thẻ *</label>
            <input
              type="text"
              placeholder="Ví dụ: Từ vựng từ sách giáo khoa"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className={styles.field}>
            <label>Mô tả (không bắt buộc)</label>
            <textarea
              placeholder="Nhập mô tả cho bộ thẻ..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              className={styles.textarea}
            />
          </div>
          <div className={styles.field}>
            <label>File PDF *</label>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              required
            />
            {file && (
              <div className={styles.fileName}>
                📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>
          {error && <div className={styles.error}>{error}</div>}
          <div className={styles.actions}>
            <button type="button" onClick={onClose}>Hủy</button>
            <button type="submit" disabled={loading}>
              {loading ? '⏳ Đang xử lý...' : '✨ Tạo bộ thẻ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadPdfModal;