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

  useEffect(() => {
    const initTest = async () => {
      const data = await createTest(id);
      setAttemptId(data.attempt_id);
      setQuestions(data.questions);
      setLoading(false);
    };
    initTest();
  }, [id]);

  // Auto-save mỗi 30 giây
  useEffect(() => {
    if (!attemptId) return;
    const interval = setInterval(async () => {
      const answersList = Object.entries(answers).map(([qid, optId]) => ({ question_id: parseInt(qid), selected_option_id: optId }));
      if (answersList.length > 0) await autoSave(attemptId, answersList);
    }, 30000);
    return () => clearInterval(interval);
  }, [attemptId, answers]);

  const handleAnswer = (questionId, optionId) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = async () => {
    const res = await submitTest(attemptId);
    setResult(res);
    setSubmitted(true);
  };

  if (loading) return <div className={styles.loading}>📝 Đang tạo đề thi...</div>;
  if (submitted && result) {
    return (
      <div className={styles.container}>
        <h2>Kết quả bài test</h2>
        <div className={styles.resultCard}>
          <p>Điểm: {result.score}%</p>
          <p>Đúng: {result.correctCount} / {result.total}</p>
          <Link to={`/sets/${id}`} className={styles.backBtn}>Về bộ thẻ</Link>
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
          <div><strong>Câu {idx+1}:</strong> {q.content}</div>
          <div className={styles.options}>
            {q.options.map(opt => (
              <label key={opt.id} className={styles.optionLabel}>
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  value={opt.id}
                  checked={answers[q.id] === opt.id}
                  onChange={() => handleAnswer(q.id, opt.id)}
                />
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