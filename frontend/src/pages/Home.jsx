import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getServicesApi } from "../services/serviceApi";
import useAuthStore from "../store/authStore";
import apiClient from "../services/apiClient";
import TipOfTheDay from "../components/TipOfTheDay";
import PerspectiveButton from "../components/ui/PerspectiveButton";
import styles from "./Home.module.css";

const Home = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user, logout } = useAuthStore();
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactMessage, setContactMessage] = useState("");
  const [contactError, setContactError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadServices();
  }, []);

  // Tự động điền email nếu đã đăng nhập
  useEffect(() => {
    if (isAuthenticated && user?.email) {
      setContactForm(prev => ({ ...prev, email: user.email }));
    }
  }, [isAuthenticated, user]);

  const loadServices = async () => {
    const data = await getServicesApi();
    setServices(data);
    setLoading(false);
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactError("");
    setContactMessage("");

    // Validation cơ bản
    if (!contactForm.name.trim()) {
      setContactError("Vui lòng nhập họ tên.");
      return;
    }
    if (!contactForm.email.trim()) {
      setContactError("Vui lòng nhập email.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactForm.email)) {
      setContactError("Email không hợp lệ.");
      return;
    }
    if (!contactForm.message.trim()) {
      setContactError("Vui lòng nhập nội dung.");
      return;
    }

    setContactLoading(true);
    try {
      const res = await apiClient.post("/contact/send", contactForm);
      setContactMessage(res.data.message);
      // Reset form, giữ lại email nếu đã đăng nhập
      setContactForm({
        name: "",
        email: isAuthenticated ? user?.email || "" : "",
        message: "",
      });
    } catch (err) {
      setContactError(
        err.response?.data?.message || "Gửi thất bại, vui lòng thử lại.",
      );
    } finally {
      setContactLoading(false);
      setTimeout(() => {
        setContactMessage("");
        setContactError("");
      }, 5000);
    }
  };

  const members = [
    { id: "vo-van-hoang", name: "Võ Văn Hoàng", role: "DevOps & Database" },
    {
      id: "nguyen-le-nhut-hao",
      name: "Nguyễn Lê Nhựt Hào",
      role: "Frontend Developer",
    },
    {
      id: "dinh-viet-hoang",
      name: "Đinh Việt Hoàng",
      role: "Backend Developer",
    },
    {
      id: "nguyen-le-huy-thai",
      name: "Nguyễn Lê Huy Thái",
      role: "Frontend Developer",
    },
    { id: "tran-minh-duc", name: "Trần Minh Đức", role: "Backend Developer" },
  ];

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
              <Link to="/login" className={styles.navBtn}>
                Đăng nhập
              </Link>
              <Link to="/register" className={styles.navBtnPrimary}>
                Đăng ký
              </Link>
            </>
          ) : (
            <>
              <span className={styles.userName}>👋 {user?.full_name}</span>
              <Link to="/dashboard" className={styles.navBtn}>
                Dashboard
              </Link>
              <button onClick={logout} className={styles.logoutBtn}>
                Đăng xuất
              </button>
            </>
          )}
        </nav>
      </header>

      <section className={styles.hero}>
        <h1>
          Chinh phục tiếng Anh <br /> với <span>EngVocab</span>
        </h1>
        <p>
          Học từ vựng thông minh bằng Flashcard SRS, kiểm tra trình độ qua quiz,
          và sử dụng AI để tạo tài liệu cá nhân hóa.
        </p>
        <div className={styles.heroButtons}>
          {!isAuthenticated ? (
            <>
              <PerspectiveButton
                color="pink"
                onClick={() => navigate("/register")}
                style={{ padding: "12px 28px", fontSize: "1rem" }}
              >
                Bắt đầu ngay
              </PerspectiveButton>
              <Link to="/login" className={styles.btnOutline}>
                Đã có tài khoản?
              </Link>
            </>
          ) : (
            <Link to="/dashboard" className={styles.btnPrimary}>
              Vào Dashboard
            </Link>
          )}
        </div>
      </section>

      <section id="services" className={styles.servicesSection}>
        <h2>✨ Dịch vụ học tập</h2>
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
                <Link
                  to={`/sets/service/${svc.id}`}
                  className={styles.btnLearn}
                >
                  📖 Học từ vựng
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="team" className={styles.teamSection}>
        <h2>👥 Đội ngũ phát triển</h2>
        <div className={styles.teamGrid}>
          {members.map((member) => (
            <Link
              to={`/team/${member.id}`}
              key={member.id}
              className={styles.memberCardLink}
            >
              <div className={styles.member}>
                <div className={styles.avatar}>👨‍💻</div>
                <h3>{member.name}</h3>
                <p>{member.role}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section id="contact" className={styles.contactSection}>
        <h2>📬 Liên hệ</h2>
        <form className={styles.contactForm} onSubmit={handleContactSubmit}>
          <input
            type="text"
            placeholder="Họ tên"
            value={contactForm.name}
            onChange={(e) =>
              setContactForm({ ...contactForm, name: e.target.value })
            }
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={contactForm.email}
            onChange={(e) =>
              setContactForm({ ...contactForm, email: e.target.value })
            }
            required
          />
          <textarea
            rows="3"
            placeholder="Nội dung"
            value={contactForm.message}
            onChange={(e) =>
              setContactForm({ ...contactForm, message: e.target.value })
            }
            required
          />
          {contactError && <div className={styles.contactError}>{contactError}</div>}
          {contactMessage && <div className={styles.contactMessage}>{contactMessage}</div>}
          <button type="submit" disabled={contactLoading}>
            {contactLoading ? "Đang gửi..." : "Gửi tin nhắn"}
          </button>
        </form>
        <div className={styles.social}>
          <a href="#">Facebook</a>
          <a href="#">Twitter</a>
          <a href="#">Email</a>
        </div>
      </section>

      <footer className={styles.footer}>
        <p>© 2026 EngVocab – Học tiếng Anh dễ dàng hơn.</p>
        <TipOfTheDay />
      </footer>
    </div>
  );
};

export default Home;