import React from "react";
import styles from "./RatingButtons.module.css";

export default function RatingButtons({ onRate }) {
    const ratingLevels = [
        { key: "AGAIN", label: "Again", desc: "Chưa nhớ", class: styles.againBtn },
        { key: "HARD", label: "Hard", desc: "Khó nhớ", class: styles.hardBtn },
        { key: "GOOD", label: "Good", desc: "Nhớ tốt", class: styles.goodBtn },
        { key: "EASY", label: "Easy", desc: "Rất dễ", class: styles.easyBtn },
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
                        <span className={styles.btnLabel}>{level.label}</span>
                        <span className={styles.btnDesc}>{level.desc}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}