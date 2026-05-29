import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import ShortWarthogFileInput from '../../components/ui/ShortWarthogFileInput';
import styles from './ImportExcelModal.module.css';

const ImportExcelModal = ({ onClose, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await apiClient.get('/services');
        setServices(res.data.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchServices();
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !title || !serviceId) {
      setError('Vui lòng điền đầy đủ thông tin');
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    if (description.trim()) formData.append('description', description.trim());
    formData.append('service_id', serviceId);
    try {
      await apiClient.post('/admin/system-sets/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Import thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h3>📥 Import bộ thẻ từ Excel/CSV</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label>Tên bộ thẻ *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div className={styles.field}>
            <label>Mô tả (không bắt buộc)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows="2"
              placeholder="Nhập mô tả cho bộ thẻ"
              className={styles.textarea}
            />
          </div>
          <div className={styles.field}>
            <label>Danh mục *</label>
            <select value={serviceId} onChange={e => setServiceId(e.target.value)} required>
              <option value="">Chọn danh mục</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label>File Excel/CSV *</label>
            <ShortWarthogFileInput
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              label="Chọn file Excel/CSV"
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
            <button type="submit" disabled={loading}>{loading ? 'Đang import...' : 'Import'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ImportExcelModal;