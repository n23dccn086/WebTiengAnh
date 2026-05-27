import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { createTest, autoSave, submitTest } from '../services/studyApi';
import styles from './StudyTest.module.css';

const StudyTest = () => {
  const { id } = useParams();
  const [attemptId, setAttemptId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const initTest = async () => {
      try {
        const data = await createTest(id, 10);
        setAttemptId(data.attempt_id);
        setQuestions(data.questions);
      } catch (err) {
        console.error(err);
        const msg = err.response?.data?.message || 'Không thể tạo đề thi, vui lòng thử lại sau.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    initTest();
  }, [id]);

  useEffect(() => {
    if (!attemptId) return;
    const interval = setInterval(async () => {
      const answersList = Object.entries(answers).map(([qid, optId]) => ({
        question_id: parseInt(qid),
        selected_option_id: optId
      }));
      if (answersList.length > 0) await autoSave(attemptId, answersList);
    }, 30000);
    return () => clearInterval(interval);
  }, [attemptId, answers]);

  const handleAnswer = (questionId, optionId) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = async () => {
    try {
      const res = await submitTest(attemptId);
      setResult(res);
      setSubmitted(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Nộp bài thất bại');
    }
  };

  if (loading) return <div className={styles.loading}>📝 Đang tạo đề thi...</div>;
  if (error) return <div className={styles.error}>❌ {error}</div>;

  if (submitted && result) {
    return (
      <div className={styles.container}>
        <h2>Kết quả bài test</h2>
        <div className={styles.resultCard}>
          <p className={styles.score}>Điểm: {result.score}%</p>
          <p>Đúng: {result.correct_count} / {result.total_questions}</p>
          {result.results && result.results.map((r, idx) => (
            <div key={idx} className={styles.resultItem}>
              <p><strong>Câu {idx + 1}:</strong> {r.is_correct ? '✅ Đúng' : '❌ Sai'}</p>
              {r.explanation && <p className={styles.explanation}>💡 {r.explanation}</p>}
            </div>
          ))}
          <div className={styles.backWrapper}>
            <Link to={`/sets/${id}`} className={styles.backBtn}>Về bộ thẻ</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Link to={`/sets/${id}`} className={styles.backBtn}>← Thoát test</Link>
      <h2>Bài kiểm tra</h2>
      {questions.map((q, idx) => (
        <div key={q.id} className={styles.questionCard}>
          <div><strong>Câu {idx + 1}:</strong> {q.content}</div>
          <div className={styles.options}>
            {q.options.map(opt => (
              <label key={opt.id} className={styles.optionLabel}>
                <input type="radio" name={`q-${q.id}`} value={opt.id} checked={answers[q.id] === opt.id} onChange={() => handleAnswer(q.id, opt.id)} />
                {opt.content}
              </label>
            ))}
          </div>
        </div>
      ))}
      <button onClick={handleSubmit} className={styles.submitBtn}>Nộp bài</button>
    </div>
  );
};

export default StudyTest;