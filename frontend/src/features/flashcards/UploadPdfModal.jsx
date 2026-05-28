import { useState, useRef } from 'react';
import apiClient from '../../services/apiClient';
import ShortWarthogFileInput from '../../components/ui/ShortWarthogFileInput';
import styles from './UploadPdfModal.module.css';

const UploadPdfModal = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type !== 'application/pdf') {
      setError('Chỉ chấp nhận file PDF. Vui lòng chọn file có đuôi .pdf');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } else {
      setError('');
      setFile(selectedFile);
    }
  };

  const handleResetFile = () => {
    setFile(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
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
      let errorMsg = 'Có lỗi xảy ra khi xử lý PDF.';
      if (err.response) {
        const status = err.response.status;
        const data = err.response.data;
        if (status === 429) {
          errorMsg = data.message || 'Bạn đã hết lượt AI hôm nay. Vui lòng thử lại sau 24 giờ hoặc nâng cấp Premium.';
        } else if (status === 403) {
          errorMsg = data.message || 'Bạn đã đạt giới hạn upload PDF (2 file/tháng) hoặc vượt quá số trang cho phép.';
        } else if (status === 400) {
          errorMsg = data.message || 'Dữ liệu gửi lên không hợp lệ.';
        } else {
          errorMsg = data.message || errorMsg;
        }
      } else if (err.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
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
            <ShortWarthogFileInput
              accept="application/pdf"
              onChange={handleFileChange}
              label="Chọn file PDF"
            />
            {file && (
              <div className={styles.fileName}>
                📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)
                <button
                  type="button"
                  onClick={handleResetFile}
                  className={styles.resetFileBtn}
                  title="Chọn file khác"
                >
                  ❌
                </button>
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