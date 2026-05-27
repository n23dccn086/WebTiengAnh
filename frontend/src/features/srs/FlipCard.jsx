import React from "react";
import styles from "./FlipCard.module.css";

export default function FlipCard({ card, isFlipped, onFlip }) {
    if (!card) return null;

    return (
        <div className={styles.scene} onClick={onFlip}>
            <div className={`${styles.card} ${isFlipped ? styles.isFlipped : ""}`}>

                {/* MẶT TRƯỚC: TỪ TIẾNG ANH */}
                <div className={`${styles.cardFace} ${styles.cardFaceFront}`}>
                    <div className={styles.hintText}>💡 Bấm vào thẻ để xem nghĩa</div>
                    <div className={styles.wordContainer}>
                        <span className={styles.partOfSpeech}>{card.part_of_speech}</span>
                        <h1 className={styles.word}>{card.word}</h1>
                        <p className={styles.pronunciation}>{card.pronunciation}</p>
                    </div>
                </div>

                {/* MẶT SAU: NGHĨA TIẾNG VIỆT + VÍ DỤ */}
                <div className={`${styles.cardFace} ${styles.cardFaceBack}`}>
                    <div className={styles.wordHeaderBack}>
                        <h3>{card.word}</h3>
                        <span className={styles.pronunciationBack}>{card.pronunciation}</span>
                    </div>

                    <div className={styles.divider}></div>

                    <div className={styles.backContent}>
                        <div className={styles.meaningSection}>
                            <span className={styles.label}>Ý nghĩa:</span>
                            <p className={styles.meaning}>{card.meaning}</p>
                        </div>

                        {card.example_sentence && (
                            <div className={styles.exampleSection}>
                                <span className={styles.label}>Ví dụ ngữ cảnh:</span>
                                <p className={styles.exampleEn}>{card.example_sentence}</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}