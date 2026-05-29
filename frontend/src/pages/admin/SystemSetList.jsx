import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import styles from './SystemSetList.module.css';

const SystemSetList = () => {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 20;

  useEffect(() => {
    fetchSets();
  }, [page]);

  const fetchSets = async () => {
    try {
      const res = await apiClient.get(`/admin/system-sets?page=${page}&limit=${limit}`);
      setSets(res.data.data.sets);
      setTotalPages(res.data.data.pagination.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa bộ thẻ hệ thống này? Toàn bộ flashcards cũng sẽ bị xóa.')) return;
    try {
      await apiClient.delete(`/admin/system-sets/${id}`);
      fetchSets();
    } catch (err) {
      alert(err.response?.data?.message || 'Xóa thất bại');
    }
  };

  if (loading) return <div className={styles.loading}>Đang tải...</div>;

  return (
    <div className={styles.container}>
      <h2>📚 Danh sách bộ thẻ hệ thống</h2>
      <Link to="/admin/system-sets/create" className={styles.createBtn}>+ Tạo bộ thẻ mới</Link>
      <div className={styles.table}>
        <table>
          <thead>
            <tr><th>ID</th><th>Tiêu đề</th><th>Mô tả</th><th>Danh mục</th><th>Số từ</th><th>Ngày tạo</th><th>Hành động</th></tr>
          </thead>
          <tbody>
            {sets.map(set => (
              <tr key={set.id}>
                <td>{set.id}</td>
                <td>{set.title}</td>
                <td>{set.description || '—'}</td>
                <td>{set.service_title}</td>
                <td>{set.total_cards}</td>
                <td>{new Date(set.created_at).toLocaleDateString()}</td>
                <td className={styles.actions}>
                  <Link to={`/admin/system-sets/edit/${set.id}`} className={styles.editBtn}>✏️ Sửa</Link>
                  <button onClick={() => handleDelete(set.id)} className={styles.deleteBtn}>🗑️ Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button disabled={page === 1} onClick={() => setPage(p => p-1)}>◀ Trước</button>
          <span>Trang {page} / {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p+1)}>Sau ▶</button>
        </div>
      )}
    </div>
  );
};

export default SystemSetList;