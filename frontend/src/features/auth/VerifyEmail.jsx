import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import styles from './auth.module.css';

const VerifyEmail = () => {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const verifyEmail = useAuthStore((state) => state.verifyEmail);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Token xác thực không hợp lệ.');
      return;
    }

    verifyEmail(token).then((res) => {
      if (res.success) {
        setStatus('success');
        setMessage(res.message);
      } else {
        setStatus('error');
        setMessage(res.message);
      }
    });
  }, [location, verifyEmail]);

  return (
    <div className={styles.container}>
      <div className={styles.form}>
        <h2>Xác thực email</h2>
        {status === 'loading' && <p style={{ color: 'white' }}>Đang xác thực...</p>}
        {status === 'success' && (
          <>
            <div className={styles.success}>{message}</div>
            <div className={styles.links} style={{ justifyContent: 'center' }}>
              <Link to="/login" className={styles.link}>Đăng nhập ngay</Link>
            </div>
          </>
        )}
        {status === 'error' && (
          <>
            <div className={styles.error}>{message}</div>
            <div className={styles.links} style={{ justifyContent: 'center' }}>
              <Link to="/login" className={styles.link}>Về trang đăng nhập</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;