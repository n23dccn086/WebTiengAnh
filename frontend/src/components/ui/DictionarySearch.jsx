import { useState, useEffect, useRef } from 'react';
import apiClient from '../../services/apiClient';
import styles from './DictionarySearch.module.css';

const DictionarySearch = () => {
  const [word, setWord] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowResult(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!word.trim()) return;
    setLoading(true);
    try {
      const res = await apiClient.post('/dictionary/auto-fill', { word: word.trim() });
      setResult(res.data.data);
      setShowResult(true);
    } catch (err) {
      console.error(err);
      setResult(null);
      setShowResult(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container} ref={wrapperRef}>
      <form onSubmit={handleSearch} className={styles.form}>
        <input
          type="text"
          placeholder="Tra từ điển..."
          value={word}
          onChange={(e) => setWord(e.target.value)}
          className={styles.input}
        />
        <button type="submit" className={styles.button} disabled={loading}>
          {loading ? '⏳' : '🔍'}
        </button>
      </form>
      {showResult && (
        <div className={styles.resultDropdown}>
          {loading && <div className={styles.loading}>Đang tra...</div>}
          {!loading && result && (
            <div>
              <div className={styles.wordHeader}>
                <strong>{result.word}</strong>
                {result.pronunciation && <span className={styles.pronounce}>/{result.pronunciation}/</span>}
                {result.part_of_speech && <span className={styles.pos}>{result.part_of_speech}</span>}
              </div>
              <p className={styles.meaning}>{result.meaning}</p>
              {result.example_sentence && <p className={styles.example}>📌 {result.example_sentence}</p>}
            </div>
          )}
          {!loading && !result && word.trim() !== '' && (
            <div className={styles.notFound}>Không tìm thấy từ "{word}"</div>
          )}
        </div>
      )}
    </div>
  );
};

export default DictionarySearch;