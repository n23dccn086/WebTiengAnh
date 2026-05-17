import { useEffect, useRef, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import styles from "./auth.module.css";

const VerifyEmail = () => {
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  const verifyEmail = useAuthStore((state) => state.verifyEmail);
  const location = useLocation();

  const hasVerified = useRef(false);

  useEffect(() => {
    if (hasVerified.current) return;
    hasVerified.current = true;

    const params = new URLSearchParams(location.search);
    const token = params.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Token xác thực không hợp lệ.");
      return;
    }

    const handleVerifyEmail = async () => {
      try {
        const res = await verifyEmail(token);

        if (res.success) {
          setStatus("success");
          setMessage(res.message || "Xác thực email thành công.");
        } else {
          setStatus("error");
          setMessage(
            res.message || "Đường dẫn xác thực không hợp lệ hoặc đã hết hạn.",
          );
        }
      } catch (error) {
        setStatus("error");
        setMessage("Có lỗi xảy ra khi xác thực email.");
      }
    };

    handleVerifyEmail();
  }, [location.search, verifyEmail]);

  return (
    <div className={styles.container}>
      <div className={styles.form}>
        <h2>Xác thực email</h2>

        {status === "loading" && (
          <p style={{ color: "white" }}>Đang xác thực...</p>
        )}

        {status === "success" && (
          <>
            <div className={styles.success}>{message}</div>
            <div className={styles.links} style={{ justifyContent: "center" }}>
              <Link to="/login" className={styles.link}>
                Đăng nhập ngay
              </Link>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <div className={styles.error}>{message}</div>
            <div className={styles.links} style={{ justifyContent: "center" }}>
              <Link to="/login" className={styles.link}>
                Về trang đăng nhập
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
