import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { createTest, submitTest, autoSave } from '../services/studyApi';
import useTestStore from '../store/testStore';
import TestBoard from "../features/study/TestBoard";
import styles from './StudyTest.module.css';

const StudyTest = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    initTestSession,
    attemptId,
    score,
    testResult,
    setTestResult,
    clearTestSession,
    answers,
    markSavedSuccess,
    setSavingStatus
  } = useTestStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const initTest = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await createTest(id, 10);
        if (data && data.questions) {
          initTestSession(data.attempt_id, data.questions);
        } else {
          setError('Không thể bóc tách cấu trúc câu hỏi từ hệ thống.');
        }
      } catch (err) {
        console.error(err);
        const msg = err.response?.data?.message || 'Không thể tạo đề thi, vui lòng thử lại sau.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    initTest();
    return () => clearTestSession();
  }, [id, initTestSession, clearTestSession]);

  useEffect(() => {
    if (!attemptId) return;
    const interval = setInterval(async () => {
      if (answers && answers.length > 0) {
        try {
          setSavingStatus(true);
          await autoSave(attemptId, answers);
          markSavedSuccess();
        } catch (err) {
          console.error("Auto-save failed", err);
          setSavingStatus(false);
        }
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [attemptId, answers, setSavingStatus, markSavedSuccess]);

  const handleSubmit = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn nộp bài kiểm tra này không?")) return;
    try {
      const res = await submitTest(attemptId);
      setTestResult(res.score, res.results);
    } catch (err) {
      alert(err.response?.data?.message || 'Nộp bài thất bại');
    }
  };

  if (loading) return <div className={styles.loading}>📝 Đang tạo đề thi...</div>;

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorBox}>
          <div className={styles.errorIcon}>❌</div>
          <h3>Hết lượt AI</h3>
          <p>{error}</p>
          <Link to={`/sets/${id}`} className={styles.errorBackBtn}>
            Quay lại bộ thẻ
          </Link>
        </div>
      </div>
    );
  }

  if (score !== null) {
    return (
      <div className={styles.container}>
        <h2>Kết quả bài test</h2>
        <div className={styles.resultCard}>
          <p className={styles.score}>Điểm: {score}%</p>
          <div className={styles.reviewList}>
            {testResult && testResult.map((r, idx) => (
              <div key={idx} className={`${styles.resultItem} ${r.is_correct ? styles.correctBorder : styles.wrongBorder}`}>
                <p><strong>Câu {idx + 1}:</strong> {r.content}</p>
                <p>Trạng thái: {r.is_correct ? '✅ Đúng' : '❌ Sai'}</p>
                {r.explanation && <p className={styles.explanation}>💡 Giải thích: {r.explanation}</p>}
              </div>
            ))}
          </div>
          <div className={styles.backWrapper}>
            <Link to={`/sets/${id}`} className={styles.backBtn}>Về bộ thẻ</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <TestBoard onSubmitTest={handleSubmit} />
    </div>
  );
};

export default StudyTest;