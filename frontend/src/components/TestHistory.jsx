import { useEffect, useState } from 'react';
import apiClient from '../services/apiClient';
import styles from './TestHistory.module.css';

const TestHistory = ({ setId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await apiClient.get(`/study/tests/history/${setId}`);
        setHistory(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [setId]);

  if (loading) return <div className={styles.loading}>📜 Đang tải lịch sử...</div>;
  if (history.length === 0) return <div className={styles.empty}>Chưa có bài test nào.</div>;

  return (
    <div className={styles.container}>
      <h3>📜 Lịch sử làm bài</h3>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Ngày</th>
              <th>Điểm</th>
              <th>Đúng/Tổng</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {history.map(item => (
              <tr key={item.attempt_id}>
                <td>{new Date(item.completed_at).toLocaleString()}</td>
                <td className={styles.score}>{item.score}%</td>
                <td>{item.correct_count}/{item.total_questions}</td>
                <td>{item.status === 'COMPLETED' ? '✅ Hoàn thành' : '⚠️ Dở'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TestHistory;