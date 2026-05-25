import { Link } from 'react-router-dom';
import styles from './AdminDashboard.module.css';

const AdminDashboard = () => {
  return (
    <div className={styles.container}>
      <h2>🔧 Admin Dashboard</h2>
      <div className={styles.grid}>
        <Link to="/admin/users" className={styles.card}>
          <h3>👥 Quản lý người dùng</h3>
          <p>Xem, ban/unban, đổi role user</p>
        </Link>
        <Link to="/admin/services" className={styles.card}>
          <h3>📂 Quản lý danh mục</h3>
          <p>Thêm, sửa, xóa danh mục khóa học</p>
        </Link>
        <Link to="/admin/system-sets" className={styles.card}>
          <h3>📚 Bộ thẻ hệ thống</h3>
          <p>Tạo bộ thẻ mặc định cho người dùng</p>
        </Link>
        <Link to="/admin/transactions" className={styles.card}>
          <h3>💰 Giao dịch</h3>
          <p>Xem lịch sử thanh toán, doanh thu</p>
        </Link>
        <Link to="/admin/staff" className={styles.card}>
          <h3>👨‍💼 Quản lý Admin</h3>
          <p>Thêm, xóa, reset mật khẩu admin (Super Admin)</p>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;