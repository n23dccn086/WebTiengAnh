import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { createTest, submitTest } from "../services/studyApi";
import useTestStore from "../store/testStore";
import TestBoard from "../features/study/TestBoard";
import { useCountdown } from "../hooks/useCountdown";
import { formatCountdown } from "../utils/formatTime";
import confetti from "canvas-confetti";
import styles from "./StudyTest.module.css";

const StudyTest = () => {
  const { id } = useParams();
  const TIME_LIMIT = 30 * 60;

  const {
    initTestSession,
    attemptId,
    score,
    testResult,
    setTestResult,
    clearTestSession,
  } = useTestStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const hasCleanedUp = useRef(false);

  const { seconds, reset } = useCountdown(TIME_LIMIT, () => {
    if (!submitted && attemptId) {
      handleSubmit(true);
    }
  });

  useEffect(() => {
    return () => {
      if (!hasCleanedUp.current) {
        hasCleanedUp.current = true;
        clearTestSession();
      }
    };
  }, [clearTestSession]);

  useEffect(() => {
    const initTest = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await createTest(id, 10);
        if (data && data.questions) {
          initTestSession(data.attempt_id, data.questions);
          reset(TIME_LIMIT);
        } else {
          setError("Không thể tạo đề thi, dữ liệu trả về không hợp lệ.");
        }
      } catch (err) {
        console.error("Lỗi tạo test:", err);
        if (err.response?.status === 429) {
          setError(
            err.response?.data?.message ||
              "Bạn đã hết lượt sử dụng AI hôm nay. Vui lòng thử lại sau 24 giờ hoặc nâng cấp Premium.",
          );
        } else {
          setError(
            err.response?.data?.message ||
              "Không thể tạo đề thi, vui lòng thử lại sau.",
          );
        }
      } finally {
        setLoading(false);
      }
    };
    initTest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSubmit = async (isTimeout = false) => {
    if (submitted) return;
    setSubmitted(true);
    try {
      const res = await submitTest(attemptId);
      setTestResult(res.score, res.results);
      if (res.score >= 80) {
        confetti({ particleCount: 300, spread: 120, origin: { y: 0.6 } });
      } else {
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      }
      if (isTimeout)
        alert("⏰ Hết thời gian làm bài! Bài thi đã được nộp tự động.");
    } catch (err) {
      alert(err.response?.data?.message || "Nộp bài thất bại");
      setSubmitted(false);
    }
  };

  if (loading)
    return <div className={styles.loading}>📝 Đang tạo đề thi...</div>;

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorBox}>
          <div className={styles.errorIcon}>❌</div>
          <h3>Không thể tạo bài kiểm tra</h3>
          <p>{error}</p>
          <Link to={`/sets/${id}`} className={styles.errorBackBtn}>
            Quay lại bộ thẻ
          </Link>
        </div>
      </div>
    );
  }

  if (score !== null) {
    return (
      <div className={styles.container}>
        <h2>Kết quả bài test</h2>
        <div className={styles.resultCard}>
          <p className={styles.score}>Điểm: {score}%</p>
          <div className={styles.reviewList}>
            {testResult &&
              testResult.map((r, idx) => (
                <div
                  key={idx}
                  className={`${styles.resultItem} ${r.is_correct ? styles.correctBorder : styles.wrongBorder}`}
                >
                  <p>
                    <strong>Câu {idx + 1}:</strong> {r.content}
                  </p>
                  <p>Trạng thái: {r.is_correct ? "✅ Đúng" : "❌ Sai"}</p>
                  {r.explanation && (
                    <p className={styles.explanation}>
                      💡 Giải thích: {r.explanation}
                    </p>
                  )}
                </div>
              ))}
          </div>
          <div className={styles.backWrapper}>
            <Link to={`/sets/${id}`} className={styles.backBtn}>
              Về bộ thẻ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.testHeader}>
        <h2>📝 Bài kiểm tra</h2>
        <div className={styles.timer}>⏱️ {formatCountdown(seconds)}</div>
      </div>
      <TestBoard onSubmitTest={() => handleSubmit(false)} />
    </div>
  );
};

export default StudyTest;
