import React from "react";
import styles from "./RatingButtons.module.css";

export default function RatingButtons({ onRate }) {
  const ratingLevels = [
    { key: "AGAIN", label: "Again", desc: "Chưa nhớ", icon: "😵", class: styles.againBtn },
    { key: "HARD", label: "Hard", desc: "Khó nhớ", icon: "🤔", class: styles.hardBtn },
    { key: "GOOD", label: "Good", desc: "Nhớ tốt", icon: "😊", class: styles.goodBtn },
    { key: "EASY", label: "Easy", desc: "Rất dễ", icon: "😎", class: styles.easyBtn }, // Đã sửa
  ];

  return (
    <div className={styles.ratingContainer}>
      <h4 className={styles.title}>Bạn nhớ từ này mức độ nào?</h4>
      <div className={styles.btnGrid}>
        {ratingLevels.map((level) => (
          <button
            key={level.key}
            className={`${styles.rateBtn} ${level.class}`}
            onClick={() => onRate(level.key)}
          >
            <div className={styles.btnIcon}>{level.icon}</div>
            <div className={styles.btnContent}>
              <span className={styles.btnLabel}>{level.label}</span>
              <span className={styles.btnDesc}>{level.desc}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}