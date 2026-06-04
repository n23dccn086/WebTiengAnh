import { useState, useRef, useEffect } from 'react';
import styles from './DictationPractice.module.css';

const DictationPractice = ({ flashcards, onClose }) => {
  const [remainingWords, setRemainingWords] = useState([]);
  const [currentWord, setCurrentWord] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [result, setResult] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [finished, setFinished] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const synthRef = useRef(window.speechSynthesis);

  // Khởi tạo danh sách từ còn lại (xáo trộn)
  useEffect(() => {
    if (flashcards.length) {
      const shuffled = [...flashcards];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      setRemainingWords(shuffled);
      setCurrentWord(shuffled[0]);
      setFinished(false);
      setResult(null);
      setUserInput('');
      setShowAnswer(false);
    }
  }, [flashcards]);

  const speakWord = () => {
    if (!currentWord) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(currentWord.word);
    utterance.lang = 'en-US';
    utterance.rate = 0.8;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    synthRef.current.speak(utterance);
  };

  const checkAnswer = () => {
    if (!currentWord) return;
    const normalizedInput = userInput.trim().toLowerCase();
    const normalizedWord = currentWord.word.trim().toLowerCase();
    if (normalizedInput === normalizedWord) {
      setResult({ correct: true, message: '✅ Chính xác!' });
      // Chuyển từ tiếp theo sau 1 giây
      setTimeout(() => {
        const newRemaining = [...remainingWords];
        newRemaining.shift();
        if (newRemaining.length === 0) {
          setFinished(true);
          setCurrentWord(null);
          setRemainingWords([]);
          setResult(null);
        } else {
          setCurrentWord(newRemaining[0]);
          setUserInput('');
          setResult(null);
          setShowAnswer(false);
          setRemainingWords(newRemaining);
        }
      }, 800);
    } else {
      setResult({ correct: false, message: '❌ Sai rồi! Hãy nghe lại và thử tiếp.' });
    }
  };

  const handleViewAnswer = () => {
    if (currentWord) {
      setShowAnswer(true);
    }
  };

  const resetPractice = () => {
    const shuffled = [...flashcards];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setRemainingWords(shuffled);
    setCurrentWord(shuffled[0]);
    setFinished(false);
    setResult(null);
    setUserInput('');
    setShowAnswer(false);
  };

  useEffect(() => {
    return () => synthRef.current.cancel();
  }, []);

  if (!flashcards.length) {
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <button className={styles.closeBtn} onClick={onClose}>✖</button>
          <p>Bộ thẻ chưa có từ vựng nào.</p>
        </div>
      </div>
    );
  }

  const progress = flashcards.length - remainingWords.length;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>✖</button>
        <h3>🎧 Nghe và viết</h3>
        {finished ? (
          <div className={styles.finishedBox}>
            <p>🎉 Bạn đã luyện hết từ trong bộ thẻ! 🎉</p>
            <button onClick={resetPractice} className={styles.resetBtn}>🔄 Làm lại</button>
          </div>
        ) : currentWord ? (
          <div className={styles.content}>
            <div className={styles.progress}>
              📊 Đã luyện: {progress} / {flashcards.length}
            </div>
            <div className={styles.wordSection}>
              <button className={styles.speakBtn} onClick={speakWord} disabled={isSpeaking}>
                {isSpeaking ? '⏳ Đang đọc...' : '🔊 Nghe lại'}
              </button>
              <input
                type="text"
                placeholder="Nhập từ bạn đã nghe..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && checkAnswer()}
                className={styles.input}
                autoFocus
              />
              <div className={styles.buttonGroup}>
                <button className={styles.checkBtn} onClick={checkAnswer}>Kiểm tra</button>
                <button className={styles.viewAnswerBtn} onClick={handleViewAnswer}>🔍 Xem đáp án</button>
              </div>
            </div>
            {result && (
              <div className={result.correct ? styles.correctMsg : styles.wrongMsg}>
                {result.message}
              </div>
            )}
            {showAnswer && !result?.correct && (
              <div className={styles.answerBox}>
                💡 Đáp án: <strong>{currentWord.word}</strong>
              </div>
            )}
          </div>
        ) : (
          <p>Đang tải...</p>
        )}
      </div>
    </div>
  );
};

export default DictationPractice;