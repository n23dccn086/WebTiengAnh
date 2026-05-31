import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { createTest, submitTest, saveProgress } from "../services/studyApi";
import useTestStore from "../store/testStore";
import TestBoard from "../features/study/TestBoard";
import { formatCountdown } from "../utils/formatTime";
import confetti from "canvas-confetti";
import { playComplete } from "../utils/sound";
import styles from "./StudyTest.module.css";

const TEST_TIME_LIMIT_SECONDS = 16 * 60;

const normalizeAnswers = (answers) => {
  if (!answers) return [];
  if (Array.isArray(answers)) {
    return answers
      .filter(
        (ans) =>
          ans &&
          ans.question_id !== undefined &&
          ans.question_id !== null &&
          ans.selected_option_id !== undefined &&
          ans.selected_option_id !== null,
      )
      .map((ans) => ({
        question_id: Number(ans.question_id),
        selected_option_id: Number(ans.selected_option_id),
      }));
  }
  if (typeof answers === "object") {
    return Object.entries(answers)
      .filter(([, optionId]) => optionId !== undefined && optionId !== null)
      .map(([questionId, optionId]) => ({
        question_id: Number(questionId),
        selected_option_id: Number(optionId),
      }));
  }
  return [];
};

const StudyTest = () => {
  const { id } = useParams();
  const location = useLocation();
  const { resumeAttemptId = null, forceNew = false } = location.state || {};

  const {
    initTestSession,
    attemptId,
    answers,
    score,
    testResult,
    setTestResult,
    clearTestSession,
  } = useTestStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TEST_TIME_LIMIT_SECONDS);

  const attemptIdRef = useRef(null);
  const submittedRef = useRef(false);
  const initCalled = useRef(false);
  const autosaveTimerRef = useRef(null);

  useEffect(() => {
    attemptIdRef.current = attemptId;
  }, [attemptId]);

  useEffect(() => {
    submittedRef.current = submitted;
  }, [submitted]);

  const restoreSavedAnswers = useCallback((questions = []) => {
    const savedAnswers = questions
      .filter(
        (q) =>
          q.selected_option_id !== null && q.selected_option_id !== undefined,
      )
      .map((q) => ({
        question_id: q.id,
        selected_option_id: q.selected_option_id,
      }));
    if (savedAnswers.length > 0) {
      const store = useTestStore.getState();
      if (typeof store.setAnswers === "function") {
        store.setAnswers(savedAnswers);
      }
    }
  }, []);

  const saveLatestAnswers = useCallback(async () => {
    const currentAttemptId = attemptIdRef.current;
    if (!currentAttemptId || submittedRef.current) return;
    const latestAnswers = normalizeAnswers(useTestStore.getState().answers);
    if (latestAnswers.length === 0) return;
    try {
      await saveProgress(currentAttemptId, latestAnswers);
    } catch (err) {
      console.error("Lỗi autosave bài test:", err);
    }
  }, []);

  const handleSubmit = useCallback(
    async (isTimeout = false) => {
      const currentAttemptId = attemptIdRef.current;
      if (submittedRef.current || !currentAttemptId) return;
      submittedRef.current = true;
      setSubmitted(true);
      try {
        await saveLatestAnswers();
        const res = await submitTest(currentAttemptId);
        setTestResult(res.score, res.results);
        playComplete(); // ✅ thêm âm thanh
        if (res.score >= 80) {
          confetti({ particleCount: 300, spread: 120, origin: { y: 0.6 } });
        } else {
          confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
        }
        if (isTimeout) {
          alert("⏰ Hết thời gian làm bài! Bài thi đã được nộp tự động.");
        }
      } catch (err) {
        alert(err.response?.data?.message || "Nộp bài thất bại");
        submittedRef.current = false;
        setSubmitted(false);
      }
    },
    [saveLatestAnswers, setTestResult],
  );

  useEffect(() => {
    if (initCalled.current) return;
    initCalled.current = true;
    const initTest = async () => {
      try {
        setLoading(true);
        setError("");
        const payload = { num_questions: 10 };
        if (forceNew) payload.force_new = true;
        if (!forceNew && resumeAttemptId)
          payload.resume_attempt_id = resumeAttemptId;
        const data = await createTest(id, payload);
        if (!data || !Array.isArray(data.questions)) {
          setError("Không thể tạo đề thi, dữ liệu trả về không hợp lệ.");
          return;
        }
        initTestSession(data.attempt_id, data.questions);
        attemptIdRef.current = data.attempt_id;
        restoreSavedAnswers(data.questions);
        const remainingSeconds = Number(data.remaining_seconds);
        if (Number.isFinite(remainingSeconds) && remainingSeconds > 0) {
          setTimeLeft(Math.floor(remainingSeconds));
        } else {
          setTimeLeft(TEST_TIME_LIMIT_SECONDS);
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
  }, [id, resumeAttemptId, forceNew, initTestSession, restoreSavedAnswers]);

  useEffect(() => {
    if (loading || error || submitted || score !== null) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, error, submitted, score, handleSubmit]);

  useEffect(() => {
    if (!attemptId || submitted) return;
    const latestAnswers = normalizeAnswers(answers);
    if (latestAnswers.length === 0) return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      saveLatestAnswers();
    }, 500);
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [answers, attemptId, submitted, saveLatestAnswers]);

  useEffect(() => {
    return () => {
      saveLatestAnswers();
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      clearTestSession();
    };
  }, [clearTestSession, saveLatestAnswers]);

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
        <div className={styles.timer}>⏱️ {formatCountdown(timeLeft)}</div>
      </div>
      <TestBoard onSubmitTest={() => handleSubmit(false)} />
    </div>
  );
};

export default StudyTest;
