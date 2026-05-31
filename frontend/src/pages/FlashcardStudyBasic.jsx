import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useSpeech from '../hooks/useSpeech';
import { getFlashcardsBySetApi } from '../services/flashcardApi';
import confetti from 'canvas-confetti';
import { playFlip, playComplete } from '../utils/sound';
import styles from './FlashcardStudyBasic.module.css';

const FlashcardStudyBasic = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { speak } = useSpeech();
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCompletion, setShowCompletion] = useState(false);

  useEffect(() => { loadCards(); }, [id]);

  const loadCards = async () => {
    const data = await getFlashcardsBySetApi(id);
    setCards(data);
    setLoading(false);
  };

  const playPronunciation = () => {
    if (cards[currentIndex]?.word) speak(cards[currentIndex].word);
  };

  const nextCard = useCallback(() => {
    if (currentIndex + 1 < cards.length) {
      setCurrentIndex(currentIndex + 1);
      setFlipped(false);
    } else {
      setShowCompletion(true);
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
      playComplete();
    }
  }, [currentIndex, cards.length]);

  const prevCard = useCallback(() => {
    if (currentIndex - 1 >= 0) {
      setCurrentIndex(currentIndex - 1);
      setFlipped(false);
    }
  }, [currentIndex]);

  const handleFlip = () => {
    setFlipped(!flipped);
    playFlip();
  };

  // Phím tắt: mũi tên trái/phải, Space (lật thẻ)
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowRight') nextCard();
      if (e.key === 'ArrowLeft') prevCard();
      if (e.key === ' ' || e.key === 'Space') {
        e.preventDefault();
        handleFlip();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [nextCard, prevCard, handleFlip]);

  const handleCloseCompletion = () => {
    setShowCompletion(false);
    navigate(`/sets/${id}`);
  };

  if (loading) return <div className={styles.loading}>📦 Đang tải thẻ học...</div>;
  if (cards.length === 0) return <div className={styles.empty}>😢 Chưa có từ vựng nào.</div>;

  const current = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className={styles.container}>
      {showCompletion && (
        <div className={styles.overlay}>
          <div className={styles.completionModal}>
            <div className={styles.emoji}>🎉</div>
            <h3>Hoàn thành! Bạn đã học xong bộ thẻ này.</h3>
            <button onClick={handleCloseCompletion} className={styles.closeBtn}>OK</button>
          </div>
        </div>
      )}
      <div className={styles.topBar}>
        <Link to={`/sets/${id}`} className={styles.backBtn}>← Thoát</Link>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progress}%` }}></div>
        </div>
        <div className={styles.counter}>{currentIndex+1} / {cards.length}</div>
      </div>
      <div className={styles.cardWrapper} onClick={handleFlip}>
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
          </div>
          <div className={styles.back}>
            <div className={styles.meaning}>{current.meaning}</div>
            {current.pronunciation && <div className={styles.pronounce}>🔊 /{current.pronunciation}/</div>}
            {current.example_sentence && <div className={styles.example}>📌 {current.example_sentence}</div>}
          </div>
        </div>
      </div>
      <div className={styles.navButtons}>
        <button onClick={prevCard} disabled={currentIndex === 0} className={styles.navBtn}>◀ Trước</button>
        <button onClick={nextCard} className={styles.navBtn}>
          {currentIndex + 1 === cards.length ? 'Hoàn thành ▶' : 'Sau ▶'}
        </button>
      </div>
    </div>
  );
};

export default FlashcardStudyBasic;