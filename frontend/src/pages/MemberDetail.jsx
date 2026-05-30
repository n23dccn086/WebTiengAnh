import { useParams, Link } from "react-router-dom";
import styles from "./MemberDetail.module.css";

const members = {
  "vo-van-hoang": {
    name: "Võ Văn Hoàng",
    role: "DevOps & Database",
    tasks: [
      "Deploy ứng dụng lên hosting (Railway)",
      "Cấu hình Docker, quản lý container",
      "Thiết kế và tối ưu cơ sở dữ liệu MySQL",
      "Bảo trì hệ thống, cập nhật phiên bản",
      "Sửa lỗi liên quan đến hiệu năng và môi trường",
    ],
    technologies: "Docker, MySQL, Railway, Linux",
  },
  "nguyen-le-nhut-hao": {
    name: "Nguyễn Lê Nhựt Hào",
    role: "Frontend Developer",
    tasks: [
      "Xây dựng toàn bộ giao diện người dùng (React)",
      "Phát triển các component: Auth, Flashcard, Admin, SRS",
      "Tích hợp API, quản lý state với Zustand",
      "Responsive design, tối ưu trải nghiệm",
      "Quản lý route, bảo vệ route",
    ],
    technologies: "React, Vite, Axios, Zustand, CSS Modules",
  },
  "dinh-viet-hoang": {
    name: "Đinh Việt Hoàng",
    role: "Backend Developer",
    tasks: [
      "Thiết kế API endpoints theo OpenAPI",
      "Phát triển các API: Auth, Flashcard, SRS, Study, Payment",
      "Tích hợp Gemini AI, MoMo thanh toán",
      "Xây dựng logic SRS (SM-2), cron jobs",
      "Viết validation, middleware bảo mật",
    ],
    technologies: "Node.js, Express, JWT, MySQL, Gemini AI",
  },
  "nguyen-le-huy-thai": {
    name: "Nguyễn Lê Huy Thái",
    role: "Frontend Developer",
    tasks: [
      "Hỗ trợ xây dựng giao diện trang Admin",
      "Phát triển modal Import Excel, Upload PDF",
      "Tối ưu CSS, sửa lỗi giao diện",
      "Viết tài liệu hướng dẫn sử dụng",
    ],
    technologies: "React, CSS Modules, Axios",
  },
  "tran-minh-duc": {
    name: "Trần Minh Đức",
    role: "Backend Developer",
    tasks: [
      "Hỗ trợ phát triển API Practice và Test",
      "Cấu hình email (Brevo), cron jobs",
      "Kiểm thử API, viết báo cáo",
    ],
    technologies: "Node.js, Express, Nodemailer, Postman",
  },
};

const MemberDetail = () => {
  const { id } = useParams();
  const member = members[id];

  if (!member) {
    return (
      <div className={styles.error}>Không tìm thấy thông tin thành viên.</div>
    );
  }

  return (
    <div className={styles.container}>
      <Link to="/" className={styles.backBtn}>
        ← Quay lại trang chủ
      </Link>
      <div className={styles.card}>
        <h1>{member.name}</h1>
        <div className={styles.role}>{member.role}</div>
        <h3>📋 Nhiệm vụ chi tiết:</h3>
        <ul className={styles.taskList}>
          {member.tasks.map((task, index) => (
            <li key={index}>{task}</li>
          ))}
        </ul>
        <h3>🛠️ Công nghệ sử dụng:</h3>
        <p className={styles.techStack}>{member.technologies}</p>
      </div>
    </div>
  );
};

export default MemberDetail;
