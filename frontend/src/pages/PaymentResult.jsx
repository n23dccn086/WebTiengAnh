import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import styles from './PaymentResult.module.css';

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const { fetchProfile, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const resultCode = searchParams.get('resultCode');
    const messageParam = searchParams.get('message');
    if (resultCode === '0') {
      setStatus('success');
      setMessage('Thanh toán thành công! Tài khoản của bạn đã được nâng cấp Premium.');
      // Cập nhật lại thông tin user
      fetchProfile().then(() => {
        // Sau khi cập nhật, nếu user là Premium thì chuyển đến premium dashboard
        const updatedUser = useAuthStore.getState().user;
        if (updatedUser?.role === 'PREMIUM' || updatedUser?.role === 'SUPER_ADMIN') {
          navigate('/premium-dashboard', { replace: true });
        }
      }).catch(err => console.error('Fetch profile failed:', err));
    } else {
      setStatus('error');
      setMessage(messageParam || 'Thanh toán thất bại hoặc bị hủy. Vui lòng thử lại.');
    }
  }, [searchParams, fetchProfile, navigate]);

  if (status === 'loading') {
    return <div className={styles.container}><div className={styles.card}><p>Đang xử lý...</p></div></div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2>Kết quả thanh toán</h2>
        {status === 'success' && (
          <>
            <div className={styles.success}>✅ {message}</div>
            <div className={styles.buttonGroup}>
              <Link to="/premium-dashboard" className={styles.btn}>Xem thống kê Premium</Link>
              <Link to="/dashboard" className={styles.btnSecondary}>Về Dashboard</Link>
            </div>
          </>
        )}
        {status === 'error' && (
          <>
            <div className={styles.error}>❌ {message}</div>
            <div className={styles.buttonGroup}>
              <Link to="/upgrade" className={styles.btn}>Thử lại</Link>
              <Link to="/dashboard" className={styles.btnSecondary}>Về Dashboard</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentResult;