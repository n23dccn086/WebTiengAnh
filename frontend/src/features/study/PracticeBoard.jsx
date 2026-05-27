import { useState } from "react";
import useAuthStore from "../../store/authStore";
import styles from "./PracticeBoard.module.css";

export default function PracticeBoard({ questions }) {
    const [currentIdx, setCurrentIdx] = useState(0);
    const [selectedOptIdx, setSelectedOptIdx] = useState(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const { user } = useAuthStore();

    if (!questions || questions.length === 0) {
        return <div className={styles.empty}>Không có câu hỏi luyện tập nào được tìm thấy.</div>;
    }

    const currentQuestion = questions[currentIdx];
    const isPremium = user?.role === "PREMIUM";

    const handleOptionClick = (optIdx) => {
        if (isAnswered) return;
        setSelectedOptIdx(optIdx);
        setIsAnswered(true);
        if (currentQuestion.options[optIdx].is_correct) {
            setScore((prev) => prev + 1);
        }
    };

    const handleNext = () => {
        if (currentIdx < questions.length - 1) {
            setCurrentIdx((prev) => prev + 1);
            setSelectedOptIdx(null);
            setIsAnswered(false);
        }
    };

    return (
        <div className={styles.boardCard}>
            <div className={styles.progressHeader}>
                <span>Câu hỏi: {currentIdx + 1} / {questions.length}</span>
                <span className={styles.scoreBadge}>Đúng: {score}</span>
            </div>

            <div className={styles.progressBar}>
                <div
                    className={styles.progressFill}
                    style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                />
            </div>

            <div className={styles.questionTypeTag}>
                {currentQuestion.question_type.replace(/_/g, " ")}
            </div>

            <h2 className={styles.questionContent}>{currentQuestion.content}</h2>

            <div className={styles.optionsGrid}>
                {currentQuestion.options.map((opt, idx) => {
                    let btnStyle = styles.optionBtn;
                    if (isAnswered) {
                        if (opt.is_correct) btnStyle += ` ${styles.correct}`;
                        else if (idx === selectedOptIdx) btnStyle += ` ${styles.wrong}`;
                        else btnStyle += ` ${styles.disabled}`;
                    } else if (idx === selectedOptIdx) {
                        btnStyle += ` ${styles.selected}`;
                    }

                    return (
                        <button
                            key={idx}
                            className={btnStyle}
                            onClick={() => handleOptionClick(idx)}
                            disabled={isAnswered}
                        >
                            <span className={styles.optPrefix}>{String.fromCharCode(65 + idx)}.</span>
                            {opt.content}
                        </button>
                    );
                })}
            </div>

            {isAnswered && (
                <div className={styles.explanationBox}>
                    <h4>💡 Giải thích đáp án:</h4>
                    <p>{currentQuestion.explanation || "Không có giải thích cho câu hỏi này."}</p>
                    {!isPremium && !currentQuestion.options[selectedOptIdx]?.is_correct && (
                        <div className={styles.upgradeHint}>
                            🌟 <a href="/upgrade">Nâng cấp Premium</a> để xem giải thích cho tất cả câu hỏi!
                        </div>
                    )}
                </div>
            )}

            <div className={styles.footerActions}>
                <button
                    className={styles.nextBtn}
                    onClick={handleNext}
                    disabled={!isAnswered || currentIdx === questions.length - 1}
                >
                    {currentIdx === questions.length - 1 ? "🎉 Hoàn thành" : "Câu tiếp theo ➜"}
                </button>
            </div>
        </div>
    );
}