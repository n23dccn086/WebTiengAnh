import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { saveSystemSet, toggleSrs } from '../services/flashcardSetApi';
import styles from './SystemDeckList.module.css';

const SystemDeckList = () => {
  const { serviceId } = useParams();
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serviceTitle, setServiceTitle] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    const fetchServiceAndDecks = async () => {
      try {
        const servicesRes = await apiClient.get('/services');
        const service = servicesRes.data.data.find(s => s.id == serviceId);
        if (service) setServiceTitle(service.title);
        
        const decksRes = await apiClient.get(`/flashcard-sets/system?service_id=${serviceId}`);
        setDecks(decksRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchServiceAndDecks();
  }, [serviceId]);

  const handleToggleSrs = async (deck) => {
    const setId = deck.id;
    setActionLoading(prev => ({ ...prev, [setId]: true }));
    try {
      // Nếu chưa lưu thì tự động lưu trước
      if (!deck.is_saved) {
        await saveSystemSet(setId);
      }
      // Bật/tắt SRS
      await toggleSrs(setId, !deck.is_srs_enabled);
      
      // Refresh danh sách
      const decksRes = await apiClient.get(`/flashcard-sets/system?service_id=${serviceId}`);
      setDecks(decksRes.data.data);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setActionLoading(prev => ({ ...prev, [setId]: false }));
    }
  };

  if (loading) return <div className={styles.loading}>📚 Đang tải bộ thẻ...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>📚 {serviceTitle} - Các bộ thẻ</h2>
        <Link to="/dashboard" className={styles.backBtn}>← Về Dashboard</Link>
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
                {/* Sửa lỗi hiển thị: ép kiểu số và chỉ hiển thị */}
                <span>📖 {Number(deck.total_cards) || 0} từ</span>
                {deck.is_saved && <span className={styles.savedBadge}>✅ Đã lưu</span>}
              </div>
              <div className={styles.actions}>
                <Link to={`/sets/${deck.id}`} className={styles.btn}>Xem chi tiết</Link>
                <button 
                  onClick={() => handleToggleSrs(deck)} 
                  disabled={actionLoading[deck.id]}
                  className={`${styles.srsBtn} ${deck.is_srs_enabled ? styles.srsOn : ''}`}
                >
                  {actionLoading[deck.id] ? '⏳' : (deck.is_srs_enabled ? '🔁 Đang bật SRS' : '⏸️ Bật SRS')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SystemDeckList;