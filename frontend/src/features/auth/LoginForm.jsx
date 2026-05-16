import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import styles from "./auth.module.css";

const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    localStorage.removeItem("auth-storage");

    try {
      const result = await login(email, password);

      if (!result.success) {
        setError(result.message || "Email hoặc mật khẩu không chính xác.");
        return;
      }

      navigate("/dashboard");
    } catch (err) {
      setError("Đăng nhập thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2>Chào mừng</h2>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.inputGroup}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={styles.input}
          />
        </div>

        <div className={styles.inputGroup} style={{ position: "relative" }}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={styles.input}
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: "absolute",
              right: "15px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "1.2rem",
              color: "white",
            }}
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>

        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? "Đang xử lý..." : "Đăng nhập"}
        </button>

        <div className={styles.links}>
          <Link to="/forgot-password" className={styles.link}>
            Quên mật khẩu?
          </Link>

          <Link to="/register" className={styles.link}>
            Chưa có tài khoản? Đăng ký
          </Link>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
