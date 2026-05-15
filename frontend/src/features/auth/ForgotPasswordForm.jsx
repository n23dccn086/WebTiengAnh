import { useState } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import styles from './auth.module.css';

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const forgotPassword = useAuthStore((state) => state.forgotPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    const result = await forgotPassword(email);
    if (result.success) {
      setMessage(result.message);
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2>Quên mật khẩu</h2>
        {error && <div className={styles.error}>{error}</div>}
        {message && <div className={styles.success}>{message}</div>}
        <div className={styles.inputGroup}>
          <input
            type="email"
            placeholder="Email của bạn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={styles.input}
          />
        </div>
        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}
        </button>
        <div className={styles.links}>
          <Link to="/login" className={styles.link}>Quay lại đăng nhập</Link>
        </div>
      </form>
    </div>
  );
};

export default ForgotPasswordForm;