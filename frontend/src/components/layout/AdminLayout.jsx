import { Link, Outlet, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import styles from './AdminLayout.module.css';

const AdminLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Kiểm tra role: chỉ ADMIN hoặc SUPER_ADMIN mới được vào
  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return <div className={styles.error}>Bạn không có quyền truy cập trang này.</div>;
  }

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>📘 Admin</div>
        <nav className={styles.nav}>
          <Link to="/admin/users">👥 Người dùng</Link>
          <Link to="/admin/services">📂 Danh mục</Link>
          <Link to="/admin/system-sets">📚 Bộ thẻ hệ thống</Link>
          <Link to="/admin/transactions">💰 Giao dịch</Link>
          {user.role === 'SUPER_ADMIN' && (
            <Link to="/admin/staff">👨‍💼 Quản trị viên</Link>
          )}
        </nav>
        <button onClick={handleLogout} className={styles.logoutBtn}>Đăng xuất</button>
      </aside>
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;