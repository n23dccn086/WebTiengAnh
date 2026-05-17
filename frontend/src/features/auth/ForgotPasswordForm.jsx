import { useState } from "react";
import { Link } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import styles from "./auth.module.css";

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const forgotPassword = useAuthStore((state) => state.forgotPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError("Vui lòng nhập email.");
      return;
    }

    try {
      setLoading(true);

      const result = await forgotPassword(email);

      if (result.success) {
        setSuccess(
          result.message || "Vui lòng kiểm tra email để đặt lại mật khẩu.",
        );
      } else {
        setError(result.message || "Gửi email đặt lại mật khẩu thất bại.");
      }
    } catch (err) {
      setError("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2>Quên mật khẩu</h2>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        <div className={styles.inputGroup}>
          <input
            type="email"
            placeholder="Nhập email của bạn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={styles.input}
          />
        </div>

        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? "Đang xử lý..." : "Gửi link đặt lại mật khẩu"}
        </button>

        <div className={styles.links}>
          <Link to="/login" className={styles.link}>
            Quay lại đăng nhập
          </Link>
        </div>
      </form>
    </div>
  );
};

export default ForgotPasswordForm;
