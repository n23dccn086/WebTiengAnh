import React from "react";
import styles from "./SRSConfig.module.css";

export default function SRSConfig({ isEnabled, onToggle }) {
    return (
        <div className={styles.configCard}>
            <div className={styles.info}>
                <h4 className={styles.title}>Thuật toán ôn tập Spaced Repetition (SM-2)</h4>
                <p className={styles.desc}>
                    Khi bật, hệ thống sẽ tự động sắp xếp lịch nhắc nhở ôn tập các từ vựng này dựa trên độ nhớ chuẩn UTC của bạn.
                </p>
            </div>
            <label className={styles.switch}>
                <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={(e) => onToggle(e.target.checked)}
                />
                <span className={styles.slider}></span>
            </label>
        </div>
    );
}