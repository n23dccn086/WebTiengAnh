import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import styles from './TestHistory.module.css';

const TestHistory = ({ setId }) => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [setId]);

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

  const handleContinue = (attemptId) => {
    navigate(`/sets/${setId}/test`, { state: { resumeAttemptId: attemptId } });
  };

  const handleReset = async (attemptId) => {
    if (!window.confirm('Bạn có chắc muốn xóa bài test đang dở này và bắt đầu làm bài mới?')) return;
    try {
      await apiClient.delete(`/study/tests/${attemptId}`);
      alert('Đã xóa bài test cũ. Bạn sẽ được chuyển sang làm bài mới.');
      // Chuyển hướng đến trang test với flag forceNew
      navigate(`/sets/${setId}/test`, { state: { forceNew: true } });
    } catch (err) {
      console.error(err);
      alert('Xóa thất bại');
    }
  };

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
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {history.map(item => (
              <tr key={item.attempt_id}>
                <td>{new Date(item.completed_at || item.started_at).toLocaleString()}</td>
                <td className={styles.score}>{item.score !== null ? `${item.score}%` : '—'}</td>
                <td>{item.correct_count}/{item.total_questions}</td>
                <td>{item.status === 'COMPLETED' ? '✅ Hoàn thành' : '⚠️ Dở'}</td>
                <td className={styles.actions}>
                  {item.status === 'IN_PROGRESS' && (
                    <>
                      <button onClick={() => handleContinue(item.attempt_id)} className={styles.continueBtn}>
                        ▶ Tiếp tục
                      </button>
                      <button onClick={() => handleReset(item.attempt_id)} className={styles.resetBtn}>
                        🔄 Làm lại
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TestHistory;