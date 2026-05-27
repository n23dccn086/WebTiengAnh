import React from "react";
import styles from "./RatingButtons.module.css";

export default function RatingButtons({ onRate }) {
    const ratingLevels = [
        { key: "AGAIN", label: "Quên rồi 😭", desc: "Học lại ngay", class: styles.againBtn },
        { key: "HARD", label: "Khó 😮‍💨", desc: "Nhớ mang máng", class: styles.hardBtn },
        { key: "GOOD", label: "Nhớ tốt 🙂", desc: "Chuẩn múi giờ", class: styles.goodBtn },
        { key: "EASY", label: "Quá dễ 😎", desc: "Thuộc làu làu", class: styles.easyBtn },
    ];

    return (
        <div className={styles.ratingContainer}>
            <h4 className={styles.title}>Độ nhớ của bạn đối với từ này thế nào?</h4>
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