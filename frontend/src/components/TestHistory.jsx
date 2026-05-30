import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import styles from './TestHistory.module.css';

const TestHistory = ({ setId }) => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState(null);

  useEffect(() => {
    if (!setId) {
      console.warn('⚠️ TestHistory: setId is empty');
      setLoading(false);
      return;
    }
    fetchHistory();
  }, [setId]);

  const fetchHistory = async () => {
    try {
      console.log('🔍 [TestHistory] Fetching history for setId:', setId);
      const res = await apiClient.get(`/study/tests/history/${setId}`);
      console.log('📊 [TestHistory] Response:', res.data);
      setHistory(res.data.data || []);
    } catch (err) {
      console.error('❌ [TestHistory] Error:', err);
      setError(err.response?.data?.message || 'Không thể tải lịch sử');
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
      alert('Đã xóa bài test cũ.');
      fetchHistory();
    } catch (err) {
      console.error(err);
      alert('Xóa thất bại');
    }
  };

  const handleViewReview = async (attemptId) => {
    try {
      const res = await apiClient.get(`/study/tests/attempts/${attemptId}`);
      setReviewData(res.data.data);
      setShowReviewModal(true);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Không thể tải chi tiết bài làm');
    }
  };

  if (loading) return <div className={styles.loading}>📜 Đang tải lịch sử...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!history.length) return <div className={styles.empty}>Chưa có bài test nào.</div>;

  return (
    <>
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
                    {item.status === 'COMPLETED' && (
                      <button onClick={() => handleViewReview(item.attempt_id)} className={styles.reviewBtn}>
                        📋 Xem lại
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showReviewModal && reviewData && (
        <div className={styles.modalOverlay} onClick={() => setShowReviewModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3>📝 Xem lại bài làm</h3>
            <div className={styles.reviewQuestions}>
              {reviewData.questions?.map((q, idx) => (
                <div key={q.id} className={styles.reviewItem}>
                  <p><strong>Câu {idx+1}:</strong> {q.content}</p>
                  <div className={styles.options}>
                    {q.options?.map(opt => {
                      let optionClass = styles.option;
                      if (opt.is_correct) optionClass += ` ${styles.correctOption}`;
                      if (q.selected_option_id === opt.id) {
                        optionClass += opt.is_correct ? ` ${styles.userCorrect}` : ` ${styles.userWrong}`;
                      }
                      return (
                        <div key={opt.id} className={optionClass}>
                          {opt.content}
                          {q.selected_option_id === opt.id && <span className={styles.userMark}> (Đã chọn)</span>}
                          {opt.is_correct && <span className={styles.correctMark}> ✓ Đáp án đúng</span>}
                        </div>
                      );
                    })}
                  </div>
                  {q.explanation && (
                    <div className={styles.explanation}>
                      💡 <strong>Giải thích:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button onClick={() => setShowReviewModal(false)} className={styles.closeBtn}>Đóng</button>
          </div>
        </div>
      )}
    </>
  );
};

export default TestHistory;