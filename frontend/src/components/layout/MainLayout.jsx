import { Link, Outlet } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import styles from './MainLayout.module.css';

const MainLayout = () => {
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <div className={styles.layout}>
      <nav className={styles.navbar}>
        <div className={styles.logo}>📘 EngVocab</div>
        <div className={styles.navLinks}>
          <Link to="/">Trang chủ</Link>
          {isAuthenticated ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/library">Thư viện</Link>
              <Link to="/profile">Hồ sơ</Link>
              <button onClick={logout} className={styles.logoutBtn}>Đăng xuất</button>
            </>
          ) : (
            <>
              <Link to="/login">Đăng nhập</Link>
              <Link to="/register">Đăng ký</Link>
            </>
          )}
        </div>
      </nav>
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;