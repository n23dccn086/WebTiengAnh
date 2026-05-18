import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSet } from '../../services/flashcardSetApi';
import styles from './CreateSetForm.module.css';

const CreateSetForm = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [serviceId, setServiceId] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await createSet({ title, description, service_id: serviceId });
    if (result && result.id) {
      navigate(`/sets/${result.id}`);
    } else {
      setError('Tạo bộ thẻ thất bại');
    }
    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <h2>📘 Tạo bộ thẻ mới</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label>Tên bộ thẻ *</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} required />
        </div>
        <div className={styles.field}>
          <label>Mô tả</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows="3" />
        </div>
        <div className={styles.field}>
          <label>Danh mục</label>
          <select value={serviceId} onChange={e => setServiceId(Number(e.target.value))}>
            <option value={1}>Từ vựng cơ bản</option>
            <option value={2}>Từ vựng nâng cao</option>
            <option value={3}>Tài liệu cá nhân</option>
          </select>
        </div>
        {error && <div className={styles.error}>{error}</div>}
        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? 'Đang tạo...' : 'Tạo bộ thẻ'}
        </button>
      </form>
    </div>
  );
};

export default CreateSetForm;