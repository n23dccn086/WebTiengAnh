import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useSpeech from '../hooks/useSpeech';
import { getTodayReviews, submitReview, learnNewCards } from '../services/srsApi';
import confetti from 'canvas-confetti';
import styles from './SRSDaily.module.css';
import FlipCard from "../features/srs/FlipCard";
import RatingButtons from "../features/srs/RatingButtons";

const SRSDaily = () => {
  const navigate = useNavigate();
  const { speak } = useSpeech();
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);
  const [learningMore, setLearningMore] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      setLoading(true);
      const data = await getTodayReviews();
      setCards(data);
      setFinished(data.length === 0);
      setError('');
    } catch (err) {
      console.error("Lỗi tải thẻ ôn tập:", err);
      setError(err.response?.data?.message || 'Không thể tải thẻ ôn tập');
    } finally {
      setLoading(false);
    }
  };

  const playPronunciation = () => {
    if (cards[currentIndex]?.word) speak(cards[currentIndex].word);
  };

  const handleRating = async (rating) => {
    const card = cards[currentIndex];
    try {
      await submitReview(card.flashcard_id, rating);
      if (currentIndex + 1 < cards.length) {
        setCurrentIndex(currentIndex + 1);
        setFlipped(false);
      } else {
        setFinished(true);
        confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleLearnMore = async () => {
    if (learningMore) return;
    setLearningMore(true);
    setError('');
    try {
      const result = await learnNewCards(20);
      console.log('Kết quả learnNewCards:', result);
      if (result && result.added_count > 0) {
        alert(`✅ Đã thêm ${result.added_count} từ mới!`);
        await loadCards();
        setFinished(false);
        setCurrentIndex(0);
        setFlipped(false);
      } else {
        const msg = result?.message || 'Không có từ mới nào để thêm. Hãy bật SRS cho nhiều bộ thẻ hơn.';
        alert(msg);
      }
    } catch (err) {
      console.error('Lỗi khi học thêm:', err);
      const msg = err.response?.data?.message || 'Không thể thêm từ mới. Vui lòng thử lại sau.';
      setError(msg);
      alert(msg);
    } finally {
      setLearningMore(false);
    }
  };

  if (loading) return <div className={styles.loading}>📚 Đang tải thẻ ôn tập...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  if (finished || cards.length === 0) {
    return (
      <div className={styles.empty}>
        <p>😊 Không có thẻ nào đến hạn. Bạn đã hoàn thành mục tiêu hôm nay!</p>
        <button 
          onClick={handleLearnMore} 
          disabled={learningMore} 
          className={styles.learnMoreBtn}
        >
          {learningMore ? '⏳ Đang xử lý...' : '📖 Học thêm từ mới'}
        </button>
        <button onClick={() => navigate('/dashboard')} className={styles.btn}>
          Về Dashboard
        </button>
      </div>
    );
  }

  const current = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <button onClick={() => navigate('/dashboard')} className={styles.backBtn}>
          ← Về Dashboard
        </button>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }}></div>
        </div>
        <div className={styles.counter}>{currentIndex + 1} / {cards.length}</div>
      </div>

      <FlipCard 
        card={current} 
        isFlipped={flipped} 
        onFlip={() => setFlipped(!flipped)} 
        onSpeak={playPronunciation}
      />
      {flipped && <RatingButtons onRate={handleRating} />}
    </div>
  );
};

export default SRSDaily;