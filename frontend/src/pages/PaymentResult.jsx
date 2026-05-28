import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import styles from "./PaymentResult.module.css";

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const statusParam = searchParams.get("status");
    const resultCode = searchParams.get("resultCode");
    const messageParam = searchParams.get("message");

    const isSuccess = statusParam === "success" || resultCode === "0";

    const isFailed =
      statusParam === "failed" ||
      statusParam === "cancelled" ||
      statusParam === "canceled" ||
      (resultCode && resultCode !== "0");

    if (isSuccess) {
      setPaymentStatus("success");
      setMessage(
        "Thanh toán thành công! Tài khoản của bạn đã được nâng cấp Premium.",
      );
      return;
    }

    if (isFailed) {
      setPaymentStatus("error");
      setMessage(
        messageParam || "Thanh toán thất bại hoặc bị hủy. Vui lòng thử lại.",
      );
      return;
    }

    setPaymentStatus("error");
    setMessage(
      "Không xác định được kết quả thanh toán. Vui lòng kiểm tra lại tài khoản.",
    );
  }, [searchParams]);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2>Kết quả thanh toán</h2>

        {paymentStatus === "loading" && <p>Đang xử lý kết quả thanh toán...</p>}

        {paymentStatus === "success" && (
          <>
            <div className={styles.success}>✅ {message}</div>

            <div className={styles.actions}>
              <Link to="/premium-dashboard" className={styles.btn}>
                Xem thống kê Premium
              </Link>

              <Link to="/dashboard" className={styles.btnSecondary}>
                Về Dashboard
              </Link>
            </div>
          </>
        )}

        {paymentStatus === "error" && (
          <>
            <div className={styles.error}>❌ {message}</div>

            <div className={styles.actions}>
              <Link to="/upgrade" className={styles.btn}>
                Thử lại
              </Link>

              <Link to="/dashboard" className={styles.btnSecondary}>
                Về Dashboard
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentResult;
