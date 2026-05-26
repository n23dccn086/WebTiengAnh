import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../services/apiClient';
import styles from './SystemDeckList.module.css';

const SystemDeckList = () => {
  const { serviceId } = useParams();
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serviceTitle, setServiceTitle] = useState('');

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
                <span>📖 {deck.total_cards || 0} từ</span>
              </div>
              <Link to={`/sets/${deck.id}`} className={styles.btn}>Xem chi tiết</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SystemDeckList;