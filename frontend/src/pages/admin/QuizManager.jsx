import { useEffect, useState } from 'react';
import apiClient from '../../services/apiClient';
import styles from './QuizManager.module.css';

const QuizManager = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const res = await apiClient.get('/static-quizzes');
      setQuizzes(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className={styles.loading}>Đang tải...</div>;

  return (
    <div className={styles.container}>
      <h2>📋 Quản lý đề thi</h2>
      <div className={styles.table}>
        <table>
          <thead>
            <tr><th>ID</th><th>Tiêu đề</th><th>Số câu</th><th>Danh mục</th><th>Hành động</th></tr>
          </thead>
          <tbody>
            {quizzes.map(quiz => (
              <tr key={quiz.id}>
                <td>{quiz.id}</td>
                <td>{quiz.title}</td>
                <td>{quiz.total_questions}</td>
                <td>{quiz.service_id}</td>
                <td>
                  <button className={styles.btn}>Sửa</button>
                  <button className={styles.btnDanger}>Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QuizManager;