import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { generatePractice } from '../services/studyApi';
import { playCorrect, playWrong } from '../utils/sound';
import useAuthStore from '../store/authStore';
import styles from './StudyPractice.module.css';

const StudyPractice = () => {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isPremium = user?.role === 'PREMIUM';

  useEffect(() => {
    const load = async () => {
      try {
        const data = await generatePractice(id, 10);
        setQuestions(data.questions || data);
      } catch (err) {
        console.error(err);
        const msg = err.response?.data?.message || 'Không thể tạo câu hỏi, vui lòng thử lại sau.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleAnswer = useCallback((optionId, isCorrect, explanation) => {
    setSelected(optionId);
    setResult({ isCorrect, explanation });
    if (isCorrect) playCorrect();
    else playWrong();
  }, []);

  const nextQuestion = useCallback(() => {
    setSelected(null);
    setResult(null);
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      alert('🏆 Hoàn thành practice!');
      window.location.href = `/sets/${id}`;
    }
  }, [currentIndex, questions.length, id]);

  const currentQ = questions[currentIndex];

  useEffect(() => {
    const handleKey = (e) => {
      if (selected !== null) {
        if (e.key === 'Enter' || e.key === 'n' || e.key === 'N') {
          e.preventDefault();
          nextQuestion();
        }
        return;
      }
      const num = parseInt(e.key);
      if (num >= 1 && num <= currentQ?.options?.length) {
        const opt = currentQ.options[num-1];
        handleAnswer(opt.id, opt.is_correct, currentQ.explanation);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selected, currentQ, handleAnswer, nextQuestion]);

  if (loading) return <div className={styles.loading}>🧠 AI đang tạo câu hỏi...</div>;
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
  if (!questions.length) return <div className={styles.empty}>Không có câu hỏi nào.</div>;

  const q = questions[currentIndex];
  return (
    <div className={styles.container}>
      <Link to={`/sets/${id}`} className={styles.backBtn}>← Quay lại</Link>
      <div className={styles.questionCard}>
        <h3>Câu {currentIndex+1}/{questions.length}</h3>
        <p className={styles.question}>{q.content}</p>
        <div className={styles.options}>
          {q.options.map((opt, idx) => (
            <button
              key={opt.id}
              className={`${styles.option} ${selected !== null && opt.is_correct ? styles.correct : ''} ${selected === opt.id && !opt.is_correct ? styles.wrong : ''}`}
              onClick={() => handleAnswer(opt.id, opt.is_correct, q.explanation)}
              disabled={selected !== null}
            >
              {opt.content}
            </button>
          ))}
        </div>
        {result && (
          <div className={result.isCorrect ? styles.correctMsg : styles.wrongMsg}>
            <div>{result.isCorrect ? '✅ Đúng!' : '❌ Sai!'}</div>
            {/* Chỉ hiển thị giải thích nếu (Premium) hoặc (không Premium và câu sai) */}
            {(isPremium || !result.isCorrect) && result.explanation && (
              <div className={styles.explanationDetail}>
                <strong>💡 Giải thích:</strong> {result.explanation}
              </div>
            )}
            {!isPremium && result.isCorrect && (
              <div className={styles.upgradeHint}>
                🌟 <a href="/upgrade">Nâng cấp Premium</a> để xem giải thích chi tiết cho câu đúng!
              </div>
            )}
            <button onClick={nextQuestion} className={styles.nextBtn}>Tiếp theo</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyPractice;