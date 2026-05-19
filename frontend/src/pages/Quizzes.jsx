import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import apiClient from '../services/apiClient';
import useAuthStore from '../store/authStore';
import styles from './Quizzes.module.css';

const Quizzes = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { logout } = useAuthStore();
  const location = useLocation();
  const serviceId = new URLSearchParams(location.search).get('service_id');

  useEffect(() => {
    fetchQuizzes();
  }, [serviceId]);

  const fetchQuizzes = async () => {
    try {
      const url = serviceId ? `/static-quizzes?service_id=${serviceId}` : '/static-quizzes';
      const res = await apiClient.get(url);
      setQuizzes(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className={styles.loading}>📖 Đang tải bộ đề...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <button onClick={logout} className={styles.logoutBtn}>🚪 Đăng xuất</button>
      </div>
      <h2>📚 Thư viện đề thi mẫu</h2>
      {quizzes.length === 0 && <p>Không có bộ đề nào cho danh mục này.</p>}
      <div className={styles.grid}>
        {quizzes.map(quiz => (
          <div key={quiz.id} className={styles.card}>
            <h3>{quiz.title}</h3>
            <p>{quiz.description}</p>
            <div className={styles.meta}>📝 {quiz.total_questions} câu hỏi</div>
            <Link to={`/quizzes/${quiz.id}`} className={styles.btn}>Làm bài ngay</Link>
          </div>
        ))}
      </div>
      <Link to="/dashboard" className={styles.backBtn}>← Về Dashboard</Link>
    </div>
  );
};

export default Quizzes;