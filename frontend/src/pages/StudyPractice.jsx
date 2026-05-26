import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { generatePractice } from '../services/studyApi';
import styles from './StudyPractice.module.css';

const StudyPractice = () => {
  const { id } = useParams();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await generatePractice(id, 10);
      setQuestions(data.questions || data);
      setLoading(false);
    };
    load();
  }, [id]);

  const handleAnswer = (optionId, isCorrect, explanation) => {
    setSelected(optionId);
    setResult({ isCorrect, explanation });
  };

  const nextQuestion = () => {
    setSelected(null);
    setResult(null);
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      alert('🏆 Hoàn thành practice!');
      window.location.href = `/sets/${id}`;
    }
  };

  if (loading) return <div className={styles.loading}>🧠 AI đang tạo câu hỏi...</div>;
  if (!questions.length) return <div className={styles.empty}>Không có câu hỏi nào.</div>;

  const q = questions[currentIndex];
  return (
    <div className={styles.container}>
      <Link to={`/sets/${id}`} className={styles.backBtn}>← Quay lại</Link>
      <div className={styles.questionCard}>
        <h3>Câu {currentIndex+1}/{questions.length}</h3>
        <p className={styles.question}>{q.content}</p>
        <div className={styles.options}>
          {q.options.map((opt) => (
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
            {result.isCorrect ? '✅ Đúng!' : `❌ Sai. ${result.explanation || 'Đáp án đúng đã được tô xanh.'}`}
            <button onClick={nextQuestion} className={styles.nextBtn}>Tiếp theo</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyPractice;