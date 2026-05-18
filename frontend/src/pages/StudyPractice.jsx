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
      const data = await generatePractice(id);
      setQuestions(data);
      setLoading(false);
    };
    load();
  }, [id]);

  const handleAnswer = (optionIndex) => {
    setSelected(optionIndex);
    const isCorrect = optionIndex === questions[currentIndex].correct_index;
    setResult({ isCorrect, explanation: questions[currentIndex].explanation });
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
        <p className={styles.question}>{q.question}</p>
        <div className={styles.options}>
          {q.options.map((opt, idx) => (
            <button
              key={idx}
              className={`${styles.option} ${selected !== null && idx === q.correct_index ? styles.correct : ''} ${selected === idx && !q.correct_index ? styles.wrong : ''}`}
              onClick={() => handleAnswer(idx)}
              disabled={selected !== null}
            >
              {opt}
            </button>
          ))}
        </div>
        {result && (
          <div className={result.isCorrect ? styles.correctMsg : styles.wrongMsg}>
            {result.isCorrect ? '✅ Đúng!' : `❌ Sai. ${result.explanation}`}
            <button onClick={nextQuestion} className={styles.nextBtn}>Tiếp theo</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyPractice;