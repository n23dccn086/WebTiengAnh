import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useSpeech from '../hooks/useSpeech';
import { getFlashcardsBySetApi } from '../services/flashcardApi';
import { submitReview } from '../services/srsApi';
import RatingButtons from "../features/srs/RatingButtons";
import styles from './FlashcardStudy.module.css';

const FlashcardStudy = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { speak } = useSpeech();
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    loadCards();
  }, [id]);

  const loadCards = async () => {
    try {
      const data = await getFlashcardsBySetApi(id);
      setCards(data);
    } catch (error) {
      console.error("Lỗi tải flashcards:", error);
    } finally {
      setLoading(false);
    }
  };

  const playPronunciation = () => {
    if (cards[currentIndex]?.word) speak(cards[currentIndex].word);
  };

  const handleReview = async (rating) => {
    const card = cards[currentIndex];
    await submitReview(card.id, rating);
    if (currentIndex + 1 < cards.length) {
      setCurrentIndex(currentIndex + 1);
      setFlipped(false);
      setShowHint(false);
    } else {
      import('canvas-confetti').then(module => {
        const confetti = module.default;
        confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
        setTimeout(() => {
          alert('🎉 Xuất sắc! Bạn đã học xong bộ thẻ này.');
          navigate(`/sets/${id}`);
        }, 200);
      }).catch(err => console.error('Lỗi load confetti:', err));
    }
  };

  if (loading) return <div className={styles.loading}>📦 Đang tải thẻ học...</div>;
  if (cards.length === 0) return <div className={styles.empty}>😢 Chưa có từ vựng nào trong bộ thẻ này.</div>;

  const current = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <Link to={`/sets/${id}`} className={styles.backBtn}>← Thoát</Link>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }}></div>
        </div>
        <div className={styles.counter}>{currentIndex+1} / {cards.length}</div>
      </div>

      <div className={styles.cardWrapper} onClick={() => setFlipped(!flipped)}>
        <div className={`${styles.card} ${flipped ? styles.flipped : ''}`}>
          <div className={styles.front}>
            <div className={styles.word}>{current.word}</div>
            <button 
              className={styles.speakBtn}
              onClick={(e) => { e.stopPropagation(); playPronunciation(); }}
              title="Phát âm"
            >
              🔊
            </button>
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

      {flipped && <RatingButtons onRate={handleReview} />}
    </div>
  );
};

export default FlashcardStudy;