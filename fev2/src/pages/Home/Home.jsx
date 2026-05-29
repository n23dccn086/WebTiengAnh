import React from 'react';
import { useNavigate, Outlet } from 'react-router-dom'; // Đã gộp chung import vào đây
import './Home.css';

const Home = () => {
  const navigate = useNavigate();

  // Dữ liệu Tính năng thực tế của hệ thống
  const features = [
    { 
      icon: 'library_add', 
      title: 'Tạo thẻ tự động', 
      desc: 'Chỉ cần nhập từ, hệ thống tự động điền Nghĩa, phiên âm (IPA) và ví dụ. Hoặc tải lên file PDF để AI tự động bóc tách từ vựng quan trọng.' 
    },
    { 
      icon: 'psychology', 
      title: 'Lặp lại ngắt quãng (SM-2)', 
      desc: 'Không học vẹt. Thuật toán tự động tính toán thời điểm bạn sắp quên một từ để nhắc nhở ôn tập vào đúng lúc cần thiết nhất.' 
    },
    { 
      icon: 'smart_toy', 
      title: 'AI Sinh đề & Giải thích', 
      desc: 'Chế độ luyện tập và thi thử sinh câu hỏi tự động. Nếu làm sai, AI sẽ phân tích ngữ nghĩa và giải thích chi tiết lý do sai.' 
    }
  ];

  // Dữ liệu Đội ngũ
  const team = [
    { name: 'Nguyễn Văn A', role: 'Fullstack Developer', initials: 'NA' },
    { name: 'Trần Thị B', role: 'AI Integration', initials: 'TB' },
    { name: 'Lê Hoàng C', role: 'UI/UX Designer', initials: 'LC' }
  ];

  return (
    <div className="landing-page">
      {/* THANH ĐIỀU HƯỚNG */}
      <nav className="public-nav glass-panel">
        <div className="nav-container">
          <div className="nav-brand">
            <span className="material-symbols-outlined glow-primary">psychology</span>
            <span className="brand-text">NeuralLearn</span>
          </div>
          <div className="nav-links hidden-mobile">
            <a href="#features">Tính năng</a>
            <a href="#premium">Gói Premium</a>
            <a href="#team">Đội ngũ</a>
          </div>
          <div className="nav-actions">
            <button className="btn-ghost" onClick={() => navigate('/login')}>Đăng nhập</button>
            <button className="btn-primary" onClick={() => navigate('/register')}>Đăng ký miễn phí</button>
          </div>
        </div>
      </nav>

      <main className="landing-main">
        {/* 1. HERO SECTION */}
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">
              Học từ vựng thông minh với <span className="text-highlight">Flashcard & AI</span>
            </h1>
            <p className="hero-subtitle">
              Ứng dụng học tập kết hợp thuật toán lặp lại ngắt quãng (SM-2) và AI. Tự động tạo bộ thẻ, sinh bài kiểm tra và giải thích chi tiết lỗi sai giúp bạn ghi nhớ sâu hơn.
            </p>
            <div className="hero-buttons">
              <button className="btn-primary btn-large glow-primary" onClick={() => navigate('/register')}>
                Bắt đầu học ngay <span className="material-symbols-outlined">arrow_forward</span>
              </button>
              <button className="btn-ghost btn-large border-outline" onClick={() => document.getElementById('features').scrollIntoView()}>
                Tìm hiểu thêm
              </button>
            </div>
          </div>
          
          <div className="hero-visual">
            <div className="floating-card glass-panel glow-primary">
              <div className="card-top">
                <span className="card-tag">TỪ VỰNG</span>
                <h3>Accommodate</h3>
                <p className="card-ipa">/əˈkɒm.ə.deɪt/</p>
              </div>
              <div className="card-bottom">
                <p>Cung cấp chỗ ở, chứa được, hoặc điều chỉnh để phù hợp với ai/cái gì.</p>
                <div className="srs-buttons">
                  <span className="srs-btn again">Again <br/><small>&lt;1m</small></span>
                  <span className="srs-btn hard">Hard <br/><small>10m</small></span>
                  <span className="srs-btn good">Good <br/><small>1d</small></span>
                  <span className="srs-btn easy">Easy <br/><small>4d</small></span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. FEATURES SECTION */}
        <section id="features" className="section-container">
          <div className="section-header">
            <h2 className="section-title">Hệ thống học tập toàn diện</h2>
            <p className="section-subtitle">Được thiết kế để tối ưu hóa quá trình tạo thẻ và ghi nhớ kiến thức.</p>
          </div>
          <div className="grid-3">
            {features.map((feat, idx) => (
              <div key={idx} className="feature-item glass-panel">
                <div className="feature-icon-box glow-primary">
                  <span className="material-symbols-outlined">{feat.icon}</span>
                </div>
                <h3>{feat.title}</h3>
                <p>{feat.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 3. PREMIUM SECTION */}
        <section id="premium" className="section-container bg-alternate rounded-xl">
          <div className="premium-banner">
            <div className="premium-text">
              <h2>Mở khóa tiềm năng với <span className="text-highlight">Tài khoản Premium</span></h2>
              <ul className="premium-benefits">
                <li><span className="material-symbols-outlined check">check_circle</span> Không giới hạn số lượng và số trang tải lên tệp PDF.</li>
                <li><span className="material-symbols-outlined check">check_circle</span> Trải nghiệm AI giải thích chuyên sâu cho mọi câu hỏi sai.</li>
                <li><span className="material-symbols-outlined check">check_circle</span> Bảng thống kê học tập (Streak, tiến độ, từ hay quên).</li>
              </ul>
            </div>
            <div className="premium-action">
              <div className="price-tag">Chỉ từ <span>49.000đ</span> /tháng</div>
              <button className="btn-primary btn-large glow-primary">Nâng cấp qua MoMo</button>
            </div>
          </div>
        </section>

        {/* 4. TEAM SECTION */}
        <section id="team" className="section-container">
          <div className="section-header">
            <h2 className="section-title">Đội ngũ phát triển</h2>
            <p className="section-subtitle">Sinh viên phát triển dự án với mục tiêu mang AI vào học tập thực tiễn.</p>
          </div>
          <div className="grid-3 team-grid">
            {team.map((member, idx) => (
              <div key={idx} className="team-card">
                <div className="avatar-placeholder">{member.initials}</div>
                <h3>{member.name}</h3>
                <p className="role">{member.role}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 5. CONTACT / CTA */}
        <section className="section-container cta-section">
          <div className="cta-box glass-panel">
            <h2>Gặp vấn đề hoặc muốn đóng góp ý kiến?</h2>
            <p>Chúng tôi luôn sẵn sàng lắng nghe để cải thiện NeuralLearn.</p>
            <a href="mailto:support@neurallearn.vn" className="btn-primary btn-large cta-btn">
              <span className="material-symbols-outlined">mail</span> Liên hệ qua Email
            </a>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="public-footer">
        <div className="footer-content">
          <div className="brand-text">NeuralLearn</div>
          <div className="footer-links">
            <a href="#">Trang chủ</a>
            <a href="#">Thư viện</a>
            <a href="#">Bảo mật</a>
          </div>
          <div className="copyright">© 2026 NeuralLearn. Phát triển cho mục đích học tập.</div>
        </div>
      </footer>

      {/* ĐÂY LÀ CHỖ HIỂN THỊ CÁC MODAL LOGIN/REGISTER */}
      <Outlet />
      
    </div>
  );
};

export default Home;