import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useAuthStore from "../store/authStore";
import { getServicesApi } from "../services/serviceApi";
import apiClient from "../services/apiClient";
import LogoutButton from "../components/ui/LogoutButton";
import styles from "./Dashboard.module.css";
import QuoteOfTheDay from "../components/ui/QuoteOfTheDay";
import ShootingStars from "../components/ui/ShootingStars";
import Rain from "../components/ui/Rain";
import Snow from "../components/ui/Snow";
import EffectToggles from "../components/ui/EffectToggles";

const Dashboard = () => {
  const { user, fetchProfile, logout } = useAuthStore();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLearned: 0,
    totalQuizzes: 0,
    averageScore: 0,
  });
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  const isPremium = user?.role === "PREMIUM";
  const [effectStates, setEffectStates] = useState({
    shootingStars: false,
    rain: false,
    snow: false,
    leaves: false,
  });

  const handleEffectToggle = (newStates) => setEffectStates(newStates);

  useEffect(() => {
    if (!user?.id) fetchProfile();
    loadServices();
    fetchStats();
    fetchLeaderboard();
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
      const res = await apiClient.get("/users/dashboard-stats");
      setStats(res.data.data);
    } catch (err) {
      console.error("Lỗi tải thống kê:", err);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await apiClient.get("/statistics/leaderboard?limit=10");
      setLeaderboard(res.data.data);
    } catch (err) {
      console.error("Lỗi tải bảng xếp hạng:", err);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  if (loading)
    return <div className={styles.loading}>📖 Đang tải dữ liệu...</div>;

  return (
    <div
      className={`${styles.container} ${isPremium ? styles.premiumContainer : ""}`}
    >
      {/* Các hiệu ứng nền thiên nhiên (mây, cỏ, lá, cây) - chỉ Premium */}
      {isPremium && (
        <>
          <div className={styles.grass}></div>
          <div className={styles.trees}></div>
        </>
      )}

      {/* Lá rơi có thể bật/tắt */}
      {isPremium && effectStates.leaves && (
        <>
          <div className={`${styles.leaf} ${styles.leaf1}`}></div>
          <div className={`${styles.leaf} ${styles.leaf2}`}></div>
          <div className={`${styles.leaf} ${styles.leaf3}`}></div>
          <div className={`${styles.leaf} ${styles.leaf4}`}></div>
          <div className={`${styles.leaf} ${styles.leaf5}`}></div>
        </>
      )}

      {/* Hiệu ứng có thể bật/tắt (sao băng, mưa, tuyết) - chỉ Premium */}
      {isPremium && effectStates.shootingStars && <ShootingStars />}
      {isPremium && effectStates.rain && <Rain />}
      {isPremium && effectStates.snow && <Snow />}

      <div className={styles.topBar}>
        <LogoutButton onClick={logout} />
      </div>
      {isPremium && <QuoteOfTheDay />}
      <div className={styles.welcome}>
        <h1>
          👋 Chào mừng, {user?.full_name || "bạn"}!
          {isPremium && <span className={styles.premiumBadge}>⭐ PREMIUM</span>}
        </h1>
        <p>
          Hãy tiếp tục hành trình <strong>chinh phục tiếng Anh</strong> của bạn.
        </p>
      </div>

      <EffectToggles isPremium={isPremium} onToggle={handleEffectToggle} />
      <div className={styles.stats}>
        <div
          className={`${styles.statCard} ${isPremium ? styles.premiumStatCard : ""}`}
        >
          <div className={styles.statIcon}>📚</div>
          <h3>Từ vựng đã học</h3>
          <p>{stats.totalLearned}</p>
        </div>
        <div
          className={`${styles.statCard} ${isPremium ? styles.premiumStatCard : ""}`}
        >
          <div className={styles.statIcon}>📝</div>
          <h3>Quiz đã làm</h3>
          <p>{stats.totalQuizzes}</p>
        </div>
        <div
          className={`${styles.statCard} ${isPremium ? styles.premiumStatCard : ""}`}
        >
          <div className={styles.statIcon}>⭐</div>
          <h3>Điểm trung bình</h3>
          <p>{stats.averageScore}%</p>
        </div>
      </div>

      <h2 className={styles.sectionTitle}>✨ Dịch vụ học tập</h2>
      <div
        className={`${styles.servicesGrid} ${isPremium ? styles.premiumServicesGrid : ""}`}
      >
        {services.map((svc) => (
          <div
            key={svc.id}
            className={`${styles.serviceCard} ${isPremium ? styles.premiumServiceCard : ""}`}
          >
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

      {/* Bảng xếp hạng */}
      <div
        className={`${styles.leaderboardSection} ${isPremium ? styles.premiumLeaderboard : ""}`}
      >
        <h3>🏆 Bảng xếp hạng tổng điểm test</h3>
        {loadingLeaderboard ? (
          <p>Đang tải...</p>
        ) : leaderboard.length === 0 ? (
          <p>Chưa có dữ liệu xếp hạng.</p>
        ) : (
          <table className={styles.leaderboardTable}>
            <thead>
              <tr>
                <th>#</th>
                <th>Email</th>
                <th>Người dùng</th>
                <th>Tổng điểm</th>
                <th>Số bài test</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((leader, idx) => (
                <tr key={leader.id}>
                  <td>{idx + 1}</td>
                  <td>{leader.email}</td>
                  <td>{leader.full_name}</td>
                  <td>{Math.round(leader.total_score)}</td>
                  <td>{leader.total_tests}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
