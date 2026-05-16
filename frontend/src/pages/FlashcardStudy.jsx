import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { getFlashcardsByServiceApi, submitReviewApi } from '../services/flashcardApi';
import styles from './FlashcardStudy.module.css';

const FlashcardStudy = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    loadCards();
  }, [serviceId]);

  const loadCards = async () => {
    const data = await getFlashcardsByServiceApi(serviceId);
    setCards(data);
    setLoading(false);
  };

  const handleReview = async (rating) => {
    const card = cards[currentIndex];
    await submitReviewApi(card.id, rating);
    if (currentIndex + 1 < cards.length) {
      setCurrentIndex(currentIndex + 1);
      setFlipped(false);
      setShowHint(false);
    } else {
      alert('🎉 Xuất sắc! Bạn đã học xong bộ thẻ này.');
      navigate('/dashboard');
    }
  };

  if (loading) return <div className={styles.loading}>📦 Đang tải thẻ học...</div>;
  if (cards.length === 0) return <div className={styles.empty}>😢 Chưa có từ vựng nào trong dịch vụ này.</div>;

  const current = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button onClick={logout} className={styles.logoutBtn}>🚪 Đăng xuất</button>
      </div>

      <div className={styles.topBar}>
        <Link to={`/flashcards/service/${serviceId}`} className={styles.backBtn}>← Thoát</Link>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }}></div>
        </div>
        <div className={styles.counter}>{currentIndex+1} / {cards.length}</div>
      </div>

      <div className={styles.cardWrapper} onClick={() => setFlipped(!flipped)}>
        <div className={`${styles.card} ${flipped ? styles.flipped : ''}`}>
          <div className={styles.front}>
            <div className={styles.word}>{current.word}</div>
            <div className={styles.hint}>
              {!flipped && (showHint ? '🔍 Nhấn vào thẻ để lật' : '🤔 Bạn đã nhớ chưa?')}
            </div>
            <button 
              className={styles.hintBtn} 
              onClick={(e) => { e.stopPropagation(); setShowHint(!showHint); }}
              title="Gợi ý"
            >
              {showHint ? '🙈' : '👁️'}
            </button>
          </div>
          <div className={styles.back}>
            <div className={styles.meaning}>{current.meaning}</div>
            {current.pronunciation && <div className={styles.pronounce}>🔊 /{current.pronunciation}/</div>}
            {current.example_sentence && <div className={styles.example}>📌 {current.example_sentence}</div>}
          </div>
        </div>
      </div>

      {flipped && (
        <div className={styles.rating}>
          <button onClick={() => handleReview('again')} className={styles.again}>😵 Again</button>
          <button onClick={() => handleReview('hard')} className={styles.hard}>🤔 Hard</button>
          <button onClick={() => handleReview('good')} className={styles.good}>😊 Good</button>
          <button onClick={() => handleReview('easy')} className={styles.easy}>😎 Easy</button>
        </div>
      )}
    </div>
  );
};

export default FlashcardStudy;