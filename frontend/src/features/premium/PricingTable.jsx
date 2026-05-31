import React, { useState } from "react";
import { createMomoPayment } from "../../services/paymentApi";
import styles from "./PricingTable.module.css";

const PricingTable = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpgrade = async () => {
    setLoading(true);
    setError("");
    try {
      const { payUrl } = await createMomoPayment();
      if (payUrl) {
        window.location.href = payUrl;
      } else {
        setError("Không thể tạo giao dịch. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Có lỗi xảy ra khi tạo thanh toán",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h3>Gói Premium 1 tháng</h3>
        <div className={styles.price}>49,000đ</div>
        <ul className={styles.features}>
          <li>✨ 200 lượt câu hỏi AI / ngày</li>
          <li>📊 Xem thống kê chi tiết</li>
          <li>📄 Upload PDF nhiều hơn</li>
          <li>🎯 Ưu tiên hỗ trợ</li>
        </ul>
        {error && <div className={styles.error}>{error}</div>}
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className={styles.button}
        >
          {loading ? "Đang xử lý..." : "Nâng cấp ngay"}
        </button>
      </div>
    </div>
  );
};

export default PricingTable;
