import { useEffect, useState } from 'react';
import apiClient from '../services/apiClient';
import styles from './PremiumDashboard.module.css';

const PremiumDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await apiClient.get('/statistics/dashboard');
      setStats(res.data.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Không thể tải dữ liệu thống kê');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className={styles.container}>Đang tải dữ liệu...</div>;
  if (error) return <div className={styles.container}>{error}</div>;
  if (!stats) return <div className={styles.container}>Không có dữ liệu</div>;

  return (
    <div className={styles.container}>
      <h2>📊 Premium Dashboard</h2>
      <div className={styles.statsGrid}>
        <div className={styles.card}>
          <h3>🔥 Chuỗi ngày học</h3>
          <p className={styles.large}>{stats.current_streak}</p>
        </div>
        <div className={styles.card}>
          <h3>📚 Tổng từ đã học</h3>
          <p className={styles.large}>{stats.total_learned}</p>
        </div>
        <div className={styles.card}>
          <h3>⏰ Thẻ đến hạn hôm nay</h3>
          <p className={styles.large}>{stats.due_today}</p>
        </div>
      </div>

      <div className={styles.section}>
        <h3>📈 Tiến độ tuần qua</h3>
        <div className={styles.chart}>
          {stats.progress_chart.map(day => (
            <div key={day.date} className={styles.barWrapper}>
              <div className={styles.bar} style={{ height: `${Math.min(day.reviewed * 5, 100)}px` }}></div>
              <span>{new Date(day.date).getDate()}</span>
              <small>{day.reviewed}</small>
            </div>
          ))}
          {stats.progress_chart.length === 0 && <p>Chưa có dữ liệu học tập</p>}
        </div>
      </div>

      <div className={styles.section}>
        <h3>😵 Top từ hay quên nhất</h3>
        <ul className={styles.wordList}>
          {stats.hardest_words.map(word => (
            <li key={word.word}>
              <strong>{word.word}</strong> – {word.meaning}
              <span className={styles.difficulty}>Độ khó: {word.ease_factor}</span>
            </li>
          ))}
          {stats.hardest_words.length === 0 && <li>Chưa có dữ liệu</li>}
        </ul>
      </div>
    </div>
  );
};

export default PremiumDashboard;