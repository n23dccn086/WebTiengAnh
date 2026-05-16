import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getServicesApi } from '../services/serviceApi';
import useAuthStore from '../store/authStore';
import styles from './Home.module.css';

const Home = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user, logout } = useAuthStore();

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    const data = await getServicesApi();
    setServices(data);
    setLoading(false);
  };

  if (loading) return <div className={styles.loading}>📖 Đang tải...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>📘 EngVocab</div>
        <nav className={styles.nav}>
          <a href="#services">Dịch vụ</a>
          <a href="#team">Đội ngũ</a>
          <a href="#contact">Liên hệ</a>
          {!isAuthenticated ? (
            <>
              <Link to="/login" className={styles.navBtn}>Đăng nhập</Link>
              <Link to="/register" className={styles.navBtnPrimary}>Đăng ký</Link>
            </>
          ) : (
            <>
              <span className={styles.userName}>👋 {user?.full_name}</span>
              <Link to="/dashboard" className={styles.navBtn}>Dashboard</Link>
              <button onClick={logout} className={styles.logoutBtn}>Đăng xuất</button>
            </>
          )}
        </nav>
      </header>

      <section className={styles.hero}>
        <h1>Chinh phục tiếng Anh <br />với <span>EngVocab</span></h1>
        <p>Học từ vựng thông minh bằng Flashcard SRS, kiểm tra trình độ qua quiz, và sử dụng AI để tạo tài liệu cá nhân hóa.</p>
        <div className={styles.heroButtons}>
          {!isAuthenticated ? (
            <>
              <Link to="/register" className={styles.btnPrimary}>Bắt đầu ngay</Link>
              <Link to="/login" className={styles.btnOutline}>Đã có tài khoản?</Link>
            </>
          ) : (
            <Link to="/dashboard" className={styles.btnPrimary}>Vào Dashboard</Link>
          )}
        </div>
      </section>

      <section id="services" className={styles.servicesSection}>
        <h2>✨ Dịch vụ học tập</h2>
        <div className={styles.servicesGrid}>
          {services.map(svc => (
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
                {!isAuthenticated ? (
                  <>
                    <Link to="/login" className={styles.btnGuest}>📖 Học từ vựng</Link>
                    <Link to="/login" className={styles.btnOutlineGuest}>📝 Làm quiz</Link>
                  </>
                ) : (
                  <>
                    <Link to={`/flashcards/service/${svc.id}`} className={styles.btn}>📖 Học từ vựng</Link>
                    <Link to={`/quizzes/service/${svc.id}`} className={styles.btnOutline}>📝 Làm quiz</Link>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="team" className={styles.teamSection}>
        <h2>👥 Đội ngũ phát triển</h2>
        <div className={styles.teamGrid}>
          <div className={styles.member}>
            <div className={styles.avatar}>👨‍💻</div>
            <h3>Nguyễn Văn A</h3>
            <p>Fullstack Developer</p>
          </div>
          <div className={styles.member}>
            <div className={styles.avatar}>👩‍🎨</div>
            <h3>Trần Thị B</h3>
            <p>UI/UX Designer</p>
          </div>
          <div className={styles.member}>
            <div className={styles.avatar}>🧠</div>
            <h3>Lê Văn C</h3>
            <p>AI Engineer</p>
          </div>
        </div>
      </section>

      <section id="contact" className={styles.contactSection}>
        <h2>📬 Liên hệ</h2>
        <form className={styles.contactForm} onSubmit={(e) => e.preventDefault()}>
          <input type="text" placeholder="Họ tên" required />
          <input type="email" placeholder="Email" required />
          <textarea rows="3" placeholder="Nội dung"></textarea>
          <button type="submit">Gửi tin nhắn</button>
        </form>
        <div className={styles.social}>
          <a href="#">Facebook</a>
          <a href="#">Twitter</a>
          <a href="#">Email</a>
        </div>
      </section>

      <footer className={styles.footer}>
        <p>© 2026 EngVocab – Học tiếng Anh dễ dàng hơn.</p>
      </footer>
    </div>
  );
};

export default Home;