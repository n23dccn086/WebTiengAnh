import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getSetDetail } from "../services/flashcardSetApi";
import styles from "./MemoryMatchGame.module.css";
import confetti from "canvas-confetti";
import { playMatch, playError, playWin } from "../utils/sound";

const MAX_PAIRS = 20;

const MemoryMatchGame = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [wordCards, setWordCards] = useState([]);
  const [meaningCards, setMeaningCards] = useState([]);
  const [matchedWords, setMatchedWords] = useState([]);
  const [matchedMeanings, setMatchedMeanings] = useState([]);
  const [selectedWord, setSelectedWord] = useState(null);
  const [selectedMeaning, setSelectedMeaning] = useState(null);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [gameWin, setGameWin] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadDeck();
  }, [id]);

  const loadDeck = async () => {
    try {
      const data = await getSetDetail(id);
      let flashcards = data.flashcards || [];
      let selected = flashcards;
      if (flashcards.length > MAX_PAIRS) {
        const shuffled = [...flashcards];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        selected = shuffled.slice(0, MAX_PAIRS);
      }
      const words = selected.map((card, idx) => ({
        id: card.id,
        content: card.word,
        pairId: idx,
      }));
      const meanings = selected.map((card, idx) => ({
        id: card.id,
        content: card.meaning,
        pairId: idx,
      }));
      for (let i = words.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [words[i], words[j]] = [words[j], words[i]];
      }
      for (let i = meanings.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [meanings[i], meanings[j]] = [meanings[j], meanings[i]];
      }
      setWordCards(words);
      setMeaningCards(meanings);
      setMatchedWords([]);
      setMatchedMeanings([]);
      setSelectedWord(null);
      setSelectedMeaning(null);
      setLives(3);
      setGameOver(false);
      setGameWin(false);
      setMessage("");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetGame = () => {
    loadDeck();
  };

  // Phím tắt R reset
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'r' || e.key === 'R') resetGame();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [resetGame]);

  const handleWordClick = (wordCard) => {
    if (gameOver || gameWin) return;
    if (matchedWords.includes(wordCard.id)) return;
    if (selectedMeaning) {
      checkMatch(wordCard, selectedMeaning);
      setSelectedMeaning(null);
    } else {
      setSelectedWord(wordCard);
      setSelectedMeaning(null);
    }
  };

  const handleMeaningClick = (meaningCard) => {
    if (gameOver || gameWin) return;
    if (matchedMeanings.includes(meaningCard.id)) return;
    if (selectedWord) {
      checkMatch(selectedWord, meaningCard);
      setSelectedWord(null);
    } else {
      setSelectedMeaning(meaningCard);
      setSelectedWord(null);
    }
  };

  const checkMatch = (word, meaning) => {
    if (word.pairId === meaning.pairId) {
      setMatchedWords([...matchedWords, word.id]);
      setMatchedMeanings([...matchedMeanings, meaning.id]);
      setMessage("✓ Chính xác!");
      playMatch();
      setTimeout(() => setMessage(""), 800);
      if (matchedWords.length + 1 === wordCards.length) {
        setGameWin(true);
        playWin();
        confetti({ particleCount: 300, spread: 120, origin: { y: 0.6 } });
      }
    } else {
      const newLives = lives - 1;
      setLives(newLives);
      setMessage(`❌ Sai! Còn ${newLives} mạng.`);
      playError();
      setTimeout(() => setMessage(""), 1000);
      if (newLives === 0) {
        setGameOver(true);
      }
    }
  };

  if (loading) return <div className={styles.loading}>🎮 Đang tải trò chơi...</div>;

  const totalPairs = wordCards.length;
  const matchedPairs = matchedWords.length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link to={`/sets/${id}`} className={styles.backBtn}>← Quay lại bộ thẻ</Link>
        <div className={styles.stats}>
          <div className={styles.lives}>💖 {lives}</div>
          <div className={styles.pairs}>✅ {matchedPairs} / {totalPairs}</div>
        </div>
      </div>
      <h2 className={styles.title}>🎴 Ghép từ với nghĩa</h2>
      {message && <div className={styles.message}>{message}</div>}
      <div className={styles.gameArea}>
        <div className={styles.column}>
          <h3>Từ vựng</h3>
          <div className={styles.cardGrid}>
            {wordCards.map((card) => (
              <div
                key={card.id}
                className={`${styles.wordCard} ${matchedWords.includes(card.id) ? styles.matched : ""} ${selectedWord?.id === card.id ? styles.selected : ""}`}
                onClick={() => handleWordClick(card)}
              >
                {card.content}
              </div>
            ))}
          </div>
        </div>
        <div className={styles.column}>
          <h3>Nghĩa</h3>
          <div className={styles.cardGrid}>
            {meaningCards.map((card) => (
              <div
                key={card.id}
                className={`${styles.meaningCard} ${matchedMeanings.includes(card.id) ? styles.matched : ""} ${selectedMeaning?.id === card.id ? styles.selected : ""}`}
                onClick={() => handleMeaningClick(card)}
              >
                {card.content}
              </div>
            ))}
          </div>
        </div>
      </div>
      {(gameOver || gameWin) && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            {gameWin && <h2>🎉 Chúc mừng bạn đã thắng! 🎉</h2>}
            {gameOver && <h2>😢 Bạn đã thua! Hãy thử lại. 😢</h2>}
            <button onClick={resetGame} className={styles.resetBtn}>Chơi lại</button>
            <Link to={`/sets/${id}`} className={styles.backBtnSmall}>Về bộ thẻ</Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemoryMatchGame;