import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useSpeech from '../hooks/useSpeech';
import { getTodayReviews, submitReview } from '../services/srsApi';
import styles from './SRSDaily.module.css';
import FlipCard from "../features/srs/FlipCard";
import RatingButtons from "../features/srs/RatingButtons";

const SRSDaily = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const { speak } = useSpeech();
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      const data = await getTodayReviews();
      setCards(data);
    } catch (error) {
      console.error("Lỗi tải thẻ ôn tập:", error);
    } finally {
      setLoading(false);
    }
  };

  const playPronunciation = () => {
    if (cards[currentIndex]?.word) speak(cards[currentIndex].word);
  };

  const handleRating = async (rating) => {
    const card = cards[currentIndex];
    await submitReview(card.flashcard_id, rating);
    if (currentIndex + 1 < cards.length) {
      setCurrentIndex(currentIndex + 1);
      setFlipped(false);
    } else {
      setFinished(true);
    }
  };

  if (loading) return <div className={styles.loading}>📚 Đang tải thẻ ôn tập...</div>;

  if (finished) {
    return (
      <div className={styles.finished}>
        <h2>🎉 Hoàn thành!</h2>
        <p>Bạn đã ôn tập hết các thẻ đến hạn hôm nay.</p>
        <button onClick={() => navigate('/dashboard')} className={styles.btn}>Về Dashboard</button>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className={styles.empty}>
        <p>😊 Không có thẻ nào đến hạn. Bạn đã hoàn thành mục tiêu hôm nay!</p>
        <button onClick={() => navigate('/dashboard')} className={styles.btn}>Về Dashboard</button>
      </div>
    );
  }

  const current = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <button onClick={logout} className={styles.logoutBtn}>🚪 Đăng xuất</button>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }}></div>
        </div>
        <div className={styles.counter}>{currentIndex + 1} / {cards.length}</div>
      </div>

      <div className={styles.cardWrapper} onClick={() => setFlipped(!flipped)}>
        <div className={`${styles.card} ${flipped ? styles.flipped : ''}`}>
          <div className={styles.front}>
            <div className={styles.word}>{current.word}</div>
            <button className={styles.speakBtn} onClick={(e) => { e.stopPropagation(); playPronunciation(); }}>
              🔊
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
          <button onClick={() => handleRating('AGAIN')} className={styles.again}>😵 Again</button>
          <button onClick={() => handleRating('HARD')} className={styles.hard}>🤔 Hard</button>
          <button onClick={() => handleRating('GOOD')} className={styles.good}>😊 Good</button>
          <button onClick={() => handleRating('EASY')} className={styles.easy}>😎 Easy</button>
        </div>
      )}
    </div>
  );
};

export default SRSDaily;