import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { getUserSets } from '../services/flashcardSetApi';
import styles from './SystemDeckList.module.css';

const SystemDeckList = () => {
  const { serviceId } = useParams();
  const { logout } = useAuthStore();
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSystemDecks();
  }, [serviceId]);

  const loadSystemDecks = async () => {
    try {
      // Gọi API lấy bộ thẻ hệ thống, lọc theo service_id
      const data = await getUserSets(serviceId);
      setDecks(data);
    } catch (error) {
      console.error('Lỗi tải bộ thẻ hệ thống:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className={styles.loading}>📚 Đang tải bộ thẻ...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>📚 Bộ thẻ hệ thống</h2>
        <button onClick={logout} className={styles.logoutBtn}>Đăng xuất</button>
      </div>
      {decks.length === 0 ? (
        <p className={styles.empty}>Chưa có bộ thẻ nào trong danh mục này.</p>
      ) : (
        <div className={styles.grid}>
          {decks.map(deck => (
            <div key={deck.id} className={styles.card}>
              <h3>{deck.title}</h3>
              <p>{deck.description || 'Không có mô tả'}</p>
              <div className={styles.meta}>
                <span>📖 {deck.total_flashcards || 0} từ</span>
              </div>
              <Link to={`/sets/${deck.id}`} className={styles.btn}>Xem chi tiết</Link>
            </div>
          ))}
        </div>
      )}
      <Link to="/dashboard" className={styles.backBtn}>← Về Dashboard</Link>
    </div>
  );
};

export default SystemDeckList;