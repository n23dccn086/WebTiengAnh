import { useEffect, useState } from 'react';
import apiClient from '../../services/apiClient';
import styles from './ServiceManager.module.css';

const ServiceManager = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', status: 'VISIBLE' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await apiClient.get('/services');
      setServices(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (editingId) {
        await apiClient.put(`/admin/services/${editingId}`, formData);
        setSuccess('Cập nhật danh mục thành công');
      } else {
        await apiClient.post('/admin/services', formData);
        setSuccess('Thêm danh mục thành công');
      }
      setFormData({ title: '', description: '', status: 'VISIBLE' });
      setEditingId(null);
      fetchServices();
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleEdit = (service) => {
    setEditingId(service.id);
    setFormData({ title: service.title, description: service.description || '', status: service.status });
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({ title: '', description: '', status: 'VISIBLE' });
    setError('');
    setSuccess('');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa danh mục này? Các bộ thẻ thuộc danh mục sẽ bị ảnh hưởng.')) return;
    try {
      await apiClient.delete(`/admin/services/${id}`);
      setSuccess('Xóa danh mục thành công');
      fetchServices();
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể xóa');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'VISIBLE' ? 'HIDDEN' : 'VISIBLE';
    try {
      await apiClient.patch(`/admin/services/${id}/status`, { status: newStatus });
      setSuccess(`Đã ${newStatus === 'VISIBLE' ? 'hiện' : 'ẩn'} danh mục`);
      fetchServices();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi cập nhật trạng thái');
    }
  };

  if (loading) return <div className={styles.loading}>Đang tải...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>📂 Quản lý danh mục (Services)</h2>
        <button className={styles.backBtn} onClick={() => window.location.href = '/admin'}>← Quay lại Admin</button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <h3>{editingId ? '✏️ Sửa danh mục' : '➕ Thêm danh mục mới'}</h3>
        <div className={styles.field}>
          <label>Tiêu đề *</label>
          <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required />
        </div>
        <div className={styles.field}>
          <label>Mô tả</label>
          <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows="2" />
        </div>
        <div className={styles.field}>
          <label>Trạng thái</label>
          <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
            <option value="VISIBLE">Hiển thị</option>
            <option value="HIDDEN">Ẩn</option>
          </select>
        </div>
        <div className={styles.buttonGroup}>
          <button type="submit" className={styles.btnPrimary}>{editingId ? 'Cập nhật' : 'Thêm mới'}</button>
          {editingId && <button type="button" className={styles.btnCancel} onClick={handleCancel}>Hủy</button>}
        </div>
      </form>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <div className={styles.table}>
        <table>
          <thead>
            <tr><th>ID</th><th>Tiêu đề</th><th>Mô tả</th><th>Trạng thái</th><th>Hành động</th></tr>
          </thead>
          <tbody>
            {services.map(service => (
              <tr key={service.id}>
                <td>{service.id}</td><td>{service.title}</td><td>{service.description}</td>
                <td>
                  <span className={service.status === 'VISIBLE' ? styles.statusVisible : styles.statusHidden}>
                    {service.status === 'VISIBLE' ? 'Hiển thị' : 'Ẩn'}
                  </span>
                </td>
                <td className={styles.actions}>
                  <button className={styles.btnEdit} onClick={() => handleEdit(service)}>✏️ Sửa</button>
                  <button className={styles.btnToggle} onClick={() => handleToggleStatus(service.id, service.status)}>
                    {service.status === 'VISIBLE' ? '🙈 Ẩn' : '👁️ Hiện'}
                  </button>
                  <button className={styles.btnDelete} onClick={() => handleDelete(service.id)}>🗑️ Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ServiceManager;