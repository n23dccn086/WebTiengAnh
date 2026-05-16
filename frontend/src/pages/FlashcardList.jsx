import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { getFlashcardsByServiceApi, addFlashcardToUserApi } from '../services/flashcardApi';
import styles from './FlashcardList.module.css';

const FlashcardList = () => {
  const { serviceId } = useParams();
  const { logout } = useAuthStore();
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState({});
  const [showMeaningId, setShowMeaningId] = useState(null);

  useEffect(() => {
    loadFlashcards();
  }, [serviceId]);

  const loadFlashcards = async () => {
    setLoading(true);
    const data = await getFlashcardsByServiceApi(serviceId);
    setFlashcards(data);
    setLoading(false);
  };

  const handleAddToLearn = async (flashcardId) => {
    const success = await addFlashcardToUserApi(flashcardId);
    if (success) {
      setAdded(prev => ({ ...prev, [flashcardId]: true }));
      setTimeout(() => {
        setAdded(prev => ({ ...prev, [flashcardId]: false }));
      }, 2000);
    }
  };

  if (loading) return <div className={styles.loading}>📖 Đang tải kho từ vựng...</div>;

  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button onClick={logout} className={styles.logoutBtn}>🚪 Đăng xuất</button>
      </div>

      <div className={styles.header}>
        <Link to="/dashboard" className={styles.backBtn}>← Quay lại</Link>
        <h2>📖 Từ vựng</h2>
      </div>

      <div className={styles.grid}>
        {flashcards.map(fc => (
          <div key={fc.id} className={styles.card}>
            <div className={styles.word}>{fc.word}</div>
            <div className={styles.meaningRow}>
              {showMeaningId === fc.id ? (
                <div className={styles.meaning}>{fc.meaning}</div>
              ) : (
                <button 
                  className={styles.seeMeaningBtn}
                  onClick={() => setShowMeaningId(fc.id)}
                >
                  👁️ Xem nghĩa
                </button>
              )}
            </div>
            {fc.pronunciation && <div className={styles.pronounce}>🔊 /{fc.pronunciation}/</div>}
            {fc.example_sentence && <div className={styles.example}>📌 {fc.example_sentence}</div>}
            <button
              onClick={() => handleAddToLearn(fc.id)}
              className={styles.addBtn}
              disabled={added[fc.id]}
            >
              {added[fc.id] ? '✅ Đã thêm' : '➕ Thêm vào danh sách học'}
            </button>
          </div>
        ))}
      </div>

      <Link to={`/flashcards/study/${serviceId}`} className={styles.studyBtn}>
        🚀 Bắt đầu học ngay
      </Link>
    </div>
  );
};

export default FlashcardList;