import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import styles from './PaymentResult.module.css';

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const resultCode = searchParams.get('resultCode');
    const messageParam = searchParams.get('message');
    if (resultCode === '0') {
      setStatus('success');
      setMessage('Thanh toán thành công! Tài khoản của bạn đã được nâng cấp Premium.');
    } else {
      setStatus('error');
      setMessage(messageParam || 'Thanh toán thất bại hoặc bị hủy. Vui lòng thử lại.');
    }
  }, [searchParams]);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2>Kết quả thanh toán</h2>
        {status === 'loading' && <p>Đang xử lý...</p>}
        {status === 'success' && (
          <>
            <div className={styles.success}>✅ {message}</div>
            <Link to="/premium-dashboard" className={styles.btn}>Xem thống kê Premium</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className={styles.error}>❌ {message}</div>
            <Link to="/upgrade" className={styles.btn}>Thử lại</Link>
          </>
        )}
        <Link to="/dashboard" className={styles.btnSecondary}>Về Dashboard</Link>
      </div>
    </div>
  );
};

export default PaymentResult;