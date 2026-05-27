import { useState } from "react";
import useTestStore from "../../store/testStore";
import useAutoSave from "../../hooks/useAutoSave";
import styles from "./TestBoard.module.css";

export default function TestBoard({ onSubmitTest }) {
    const {
        questions,
        answers,
        selectOption,
        isSaving,
        lastSavedAt,
        getSelectedOption
    } = useTestStore();

    const [activeIdx, setActiveIdx] = useState(0);

    // Kích hoạt cơ chế Auto-save chạy ngầm 15 giây một lần
    // useAutoSave(15000);

    if (!questions || questions.length === 0) return null;

    const currentQ = questions[activeIdx];
    const selectedOptionId = getSelectedOption(currentQ.id);

    return (
        <div className={styles.testContainer}>
            {/* KHỐI LÀM BÀI BÊN TRÁI */}
            <div className={styles.mainExam}>
                <div className={styles.topStatus}>
                    <div className={styles.examTitle}>📝 Bài Kiểm Tra Khảo Sát Năng Lực</div>
                    <div className={styles.syncStatus}>
                        {isSaving ? (
                            <span className={styles.savingText}>🔄 Đang tự động lưu nháp...</span>
                        ) : lastSavedAt ? (
                            <span className={styles.savedText}>✓ Đã lưu nháp lúc {lastSavedAt}</span>
                        ) : (
                            <span className={styles.idleText}>● Hệ thống Auto-save đã bật</span>
                        )}
                    </div>
                </div>

                <div className={styles.questionCard}>
                    <div className={styles.questionHeader}>
                        <span className={styles.qIndexBadge}>Câu hỏi {activeIdx + 1}</span>
                        <span className={styles.qType}>{currentQ.question_type}</span>
                    </div>
                    <h3 className={styles.qContent}>{currentQ.content}</h3>

                    <div className={styles.optionsList}>
                        {currentQ.options.map((opt) => (
                            <label
                                key={opt.id}
                                className={`${styles.optionItem} ${selectedOptionId === opt.id ? styles.checkedItem : ""}`}
                            >
                                <input
                                    type="radio"
                                    name={`question-${currentQ.id}`}
                                    checked={selectedOptionId === opt.id}
                                    onChange={() => selectOption(currentQ.id, opt.id)}
                                    className={styles.hiddenRadio}
                                />
                                <span className={styles.radioCustom}></span>
                                <span className={styles.optText}>{opt.content}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className={styles.navControls}>
                    <button
                        disabled={activeIdx === 0}
                        onClick={() => setActiveIdx(p => p - 1)}
                        className={styles.prevBtn}
                    >
                        ◀ Câu Trước
                    </button>
                    <button
                        disabled={activeIdx === questions.length - 1}
                        onClick={() => setActiveIdx(p => p + 1)}
                        className={styles.nextBtn}
                    >
                        Câu Tiếp Theo ▶
                    </button>
                </div>
            </div>

            {/* KHAY ĐIỀU HƯỚNG LƯỚI BÊN PHẢI */}
            <div className={styles.sidePanel}>
                <h4 className={styles.panelTitle}>Bảng Lộ Trình Câu Hỏi</h4>
                <div className={styles.questionsGrid}>
                    {questions.map((q, idx) => {
                        const isDone = getSelectedOption(q.id) !== null;
                        let gridItemClass = styles.gridItem;
                        if (idx === activeIdx) gridItemClass += ` ${styles.activeGrid}`;
                        else if (isDone) gridItemClass += ` ${styles.doneGrid}`;

                        return (
                            <button
                                key={q.id}
                                className={gridItemClass}
                                onClick={() => setActiveIdx(idx)}
                            >
                                {idx + 1}
                            </button>
                        );
                    })}
                </div>

                <div className={styles.summaryStats}>
                    📊 Đã làm: <strong>{answers.length}</strong> / {questions.length} câu
                </div>

                <button className={styles.submitBtn} onClick={onSubmitTest}>
                    📤 Nộp Bài Kiểm Tra
                </button>
            </div>
        </div>
    );
}