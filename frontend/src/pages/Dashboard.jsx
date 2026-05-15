import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { getServicesApi } from '../services/serviceApi';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const { user, fetchProfile } = useAuthStore();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSecret, setShowSecret] = useState(false); // ví dụ icon mắt cho một thông tin thú vị

  useEffect(() => {
    if (!user?.id) fetchProfile();
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const data = await getServicesApi();
      setServices(data);
    } catch (error) {
      console.error('Lỗi tải services:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className={styles.loading}>📖 Đang tải dữ liệu...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.welcome}>
        <h1>👋 Chào mừng, {user?.full_name || 'bạn'}!</h1>
        <p>Hãy tiếp tục hành trình <strong>chinh phục tiếng Anh</strong> của bạn.</p>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📚</div>
          <h3>Từ vựng đã học</h3>
          <p>{user?.total_words_learned || 42}</p>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📝</div>
          <h3>Quiz đã làm</h3>
          <p>{user?.total_quizzes_done || 7}</p>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>⭐</div>
          <h3>Điểm trung bình</h3>
          <p>{user?.avg_score || 85}%</p>
          <button 
            className={styles.eyeBtn} 
            onClick={() => setShowSecret(!showSecret)}
            title="Xem bí mật điểm số"
          >
            {showSecret ? '🙈' : '👁️'}
          </button>
          {showSecret && <div className={styles.secret}>🎯 Bạn giỏi lắm!</div>}
        </div>
      </div>

      <h2 className={styles.sectionTitle}>✨ Dịch vụ học tập</h2>
      <div className={styles.servicesGrid}>
        {services.map((svc) => (
          <div key={svc.id} className={styles.serviceCard}>
            <div className={styles.serviceIcon}>
              {svc.id === 1 && '🔤'}
              {svc.id === 2 && '🎧'}
              {svc.id === 3 && '🌏'}
              {svc.id === 4 && '📖'}
            </div>
            <h3>{svc.title}</h3>
            <p>{svc.description}</p>
            <div className={styles.buttons}>
              <Link to={`/flashcards/service/${svc.id}`} className={styles.btn}>
                📖 Học từ vựng
              </Link>
              <Link to={`/quizzes/service/${svc.id}`} className={styles.btnOutline}>
                📝 Làm quiz
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;