import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useAuthStore from "../store/authStore";
import { getServicesApi } from "../services/serviceApi";
import apiClient from "../services/apiClient";
import LogoutButton from "../components/ui/LogoutButton";
import styles from "./Dashboard.module.css";

const Dashboard = () => {
  const { user, fetchProfile, logout } = useAuthStore();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalLearned: 0, totalQuizzes: 0, averageScore: 0 });

  useEffect(() => {
    if (!user?.id) fetchProfile();
    loadServices();
    fetchStats();
  }, []);

  const loadServices = async () => {
    try {
      const data = await getServicesApi();
      setServices(data);
    } catch (error) {
      console.error("Lỗi tải services:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await apiClient.get('/users/dashboard-stats');
      setStats(res.data.data);
    } catch (err) {
      console.error('Lỗi tải thống kê:', err);
    }
  };

  if (loading) return <div className={styles.loading}>📖 Đang tải dữ liệu...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <LogoutButton onClick={logout} />
      </div>

      <div className={styles.welcome}>
        <h1>👋 Chào mừng, {user?.full_name || "bạn"}!</h1>
        <p>Hãy tiếp tục hành trình <strong>chinh phục tiếng Anh</strong> của bạn.</p>
      </div>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📚</div>
          <h3>Từ vựng đã học</h3>
          <p>{stats.totalLearned}</p>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📝</div>
          <h3>Quiz đã làm</h3>
          <p>{stats.totalQuizzes}</p>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>⭐</div>
          <h3>Điểm trung bình</h3>
          <p>{stats.averageScore}%</p>
        </div>
      </div>

      <h2 className={styles.sectionTitle}>✨ Dịch vụ học tập</h2>
      <div className={styles.servicesGrid}>
        {services.map((svc) => (
          <div key={svc.id} className={styles.serviceCard}>
            <div className={styles.serviceIcon}>
              {svc.id === 1 && "🔤"}
              {svc.id === 2 && "🎧"}
              {svc.id === 3 && "🌏"}
              {svc.id === 4 && "📖"}
              {svc.id === 5 && "🚀"}
              {svc.id === 6 && "📄"}
            </div>
            <h3>{svc.title}</h3>
            <p>{svc.description}</p>
            <div className={styles.buttonGroup}>
              <Link to={`/sets/service/${svc.id}`} className={styles.btnLearn}>
                📖 Học từ vựng
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;