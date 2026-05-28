import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { useCountdown } from '../hooks/useCountdown';
import { formatCountdown } from '../utils/formatTime';
import styles from './QuizDetail.module.css';

const QuizDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);

  // Đếm ngược 15 phút = 900 giây
  const TIME_LIMIT = 15 * 60; // 900 giây
  const { seconds, reset } = useCountdown(TIME_LIMIT, () => {
    // Hết giờ -> tự động nộp bài
    if (!submitted) handleSubmit(true);
  });

  useEffect(() => {
    fetchQuiz();
  }, [id]);

  const fetchQuiz = async () => {
    try {
      const res = await apiClient.get(`/static-quizzes/${id}`);
      setQuiz(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (questionId, optionId) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = (isTimeout = false) => {
    let correctCount = 0;
    quiz.questions.forEach(q => {
      const selected = answers[q.id];
      const correctOption = q.options.find(opt => opt.is_correct === true);
      if (selected && correctOption && parseInt(selected) === correctOption.id) {
        correctCount++;
      }
    });
    const score = (correctCount / quiz.questions.length) * 100;
    setResult({ score, correctCount, total: quiz.questions.length });
    setSubmitted(true);
    if (isTimeout) alert('⏰ Hết thời gian! Bài thi đã được tự động nộp.');
  };

  if (loading) return <div className={styles.loading}>Đang tải đề thi...</div>;
  if (!quiz) return <div className={styles.error}>Không tìm thấy bộ đề</div>;

  if (submitted) {
    return (
      <div className={styles.resultContainer}>
        <h2>Kết quả: {quiz.title}</h2>
        <p>Điểm số: <strong>{result.score.toFixed(2)}%</strong></p>
        <p>Đúng {result.correctCount} / {result.total} câu</p>
        <Link to="/quizzes" className={styles.btn}>📋 Về danh sách đề</Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>{quiz.title}</h2>
        <div className={styles.timer}>⏱️ {formatCountdown(seconds)}</div>
      </div>
      <p>{quiz.description}</p>
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(false); }}>
        {quiz.questions.map((q, idx) => (
          <div key={q.id} className={styles.question}>
            <p><strong>Câu {idx+1}:</strong> {q.content}</p>
            <div className={styles.options}>
              {q.options.map(opt => (
                <label key={opt.id} className={styles.option}>
                  <input
                    type="radio"
                    name={`q${q.id}`}
                    value={opt.id}
                    onChange={() => handleSelect(q.id, opt.id)}
                    required
                  />
                  <span>{opt.content}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
        <button type="submit" className={styles.submitBtn}>✅ Nộp bài</button>
      </form>
    </div>
  );
};

export default QuizDetail;