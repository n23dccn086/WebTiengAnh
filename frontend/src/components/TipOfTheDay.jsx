import { useEffect, useState } from 'react';
import apiClient from '../services/apiClient';
import styles from './TipOfTheDay.module.css';

const TipOfTheDay = () => {
  const [tip, setTip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTip = async () => {
      try {
        const res = await apiClient.get('/tip/random-word');
        setTip(res.data.data);
      } catch (err) {
        console.error('Lỗi lấy tip:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTip();
  }, []);

  if (loading) return <div className={styles.container}>📖 Đang tải...</div>;
  if (!tip) return <div className={styles.container}>✨ Học một từ mới mỗi ngày!</div>;

  return (
    <div className={styles.container}>
      <div className={styles.title}>✨ Từ vựng hôm nay</div>
      <div className={styles.word}>{tip.word}</div>
      <div className={styles.meaning}>{tip.meaning}</div>
      {tip.pronunciation && <div className={styles.pronounce}>/{tip.pronunciation}/</div>}
      {tip.example_sentence && <div className={styles.example}>📌 {tip.example_sentence}</div>}
    </div>
  );
};

export default TipOfTheDay;