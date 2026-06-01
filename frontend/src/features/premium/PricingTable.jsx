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
      {/* Các lớp hiệu ứng nền */}
      <div className={`${styles.cloud} ${styles.cloud1}`}></div>
      <div className={`${styles.cloud} ${styles.cloud2}`}></div>
      <div className={`${styles.cloud} ${styles.cloud3}`}></div>
      <div className={styles.grass}></div>
      <div className={styles.trees}></div>
      <div className={`${styles.leaf} ${styles.leaf1}`}></div>
      <div className={`${styles.leaf} ${styles.leaf2}`}></div>
      <div className={`${styles.leaf} ${styles.leaf3}`}></div>
      <div className={`${styles.leaf} ${styles.leaf4}`}></div>
      <div className={`${styles.leaf} ${styles.leaf5}`}></div>

      <div className={styles.card}>
        <div className={styles.badge}>🔥 ƯU ĐÃI</div>
        <div className={styles.packageIcon}>💎</div>
        <h3>Gói Premium</h3>
        <div className={styles.duration}>1 tháng</div>
        <div className={styles.price}>
          49.000<span>đ</span>
          <small>/tháng</small>
        </div>
        <div className={styles.originalPrice}>Gốc 99.000đ</div>
        <ul className={styles.features}>
          <li><span>✨</span> 200 lượt câu hỏi AI / ngày</li>
          <li><span>📊</span> Xem thống kê chi tiết</li>
          <li><span>📄</span> Upload PDF không giới hạn</li>
          <li><span>🎯</span> Ưu tiên hỗ trợ</li>
          <li><span>🚀</span> Không quảng cáo</li>
        </ul>
        {error && <div className={styles.error}>{error}</div>}
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className={styles.button}
        >
          {loading ? (
            <span className={styles.loadingSpinner}></span>
          ) : (
            <>Nâng cấp ngay →</>
          )}
        </button>
        <div className={styles.footerNote}>Thanh toán an toàn qua MoMo</div>
      </div>
    </div>
  );
};

export default PricingTable;