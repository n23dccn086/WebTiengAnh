import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { createTest, submitTest, autoSave } from '../services/studyApi';
import useTestStore from '../store/testStore';
import TestBoard from "../features/study/TestBoard";
import styles from './StudyTest.module.css';

const StudyTest = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Bóc tách chuẩn xác theo các state/action đang có trong Zustand Store của bạn
  const {
    initTestSession,
    attemptId,
    score,
    testResult,
    setTestResult,
    clearTestSession,
    answers,             // Mảng [{ question_id, selected_option_id }]
    markSavedSuccess,     // Hàm cập nhật trạng thái đã lưu xong
    setSavingStatus       // Hàm cập nhật trạng thái đang lưu
  } = useTestStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 1. KHỞI TẠO PHÒNG THI
  useEffect(() => {
    const initTest = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await createTest(id, 10);

        if (data && data.questions) {
          initTestSession(data.attempt_id, data.questions);
        } else {
          setError('Không thể bóc tách cấu trúc câu hỏi từ hệ thống.');
        }
      } catch (err) {
        console.error(err);
        const msg = err.response?.data?.message || 'Không thể tạo đề thi, vui lòng thử lại sau.';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    initTest();
    return () => clearTestSession();
  }, [id, initTestSession, clearTestSession]);

  // 2. VÒNG LẶP AUTO-SAVE TỰ ĐỘNG (Dùng mảng Array trực tiếp từ Zustand Store)
  useEffect(() => {
    if (!attemptId) return;

    const interval = setInterval(async () => {
      // Vì answers trong store của bạn ĐÃ LÀ MẢNG [{ question_id, selected_option_id }] rồi
      // Nên ta kiểm tra trực tiếp độ dài của mảng, không cần ép kiểu nữa!
      if (answers && answers.length > 0) {
        try {
          setSavingStatus(true); // Bật trạng thái "Đang lưu..." trên giao diện

          // Bắn thẳng mảng answers chuẩn chỉnh lên MySQL
          await autoSave(attemptId, answers);

          markSavedSuccess(); // Lưu xong -> Cập nhật lastSavedAt hiển thị giờ lưu nháp thành công
          console.log("🚀 [Auto-Save]: Đã đồng bộ mảng đáp án thành công vào DB!");
        } catch (err) {
          console.error("❌ Lỗi lưu nháp tự động:", err);
          setSavingStatus(false);
        }
      }
    }, 15000); // 15 giây lưu nháp một lần

    return () => clearInterval(interval);
  }, [attemptId, answers, setSavingStatus, markSavedSuccess]);

  // 3. XỬ LÝ NỘP BÀI THI
  const handleSubmit = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn nộp bài kiểm tra này không?")) return;
    try {
      const res = await submitTest(attemptId);
      setTestResult(res.score, res.results);
    } catch (err) {
      alert(err.response?.data?.message || 'Nộp bài thất bại');
    }
  };

  // --- RENDERING INTERFACE ---
  if (loading) return <div className={styles.loading}>📝 Đang tạo đề thi...</div>;

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorBanner}>❌ {error}</div>
        <button className={styles.backBtnCenter} onClick={() => navigate(-1)}>
          Quay lại bộ thẻ
        </button>
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
            {testResult && testResult.map((r, idx) => (
              <div key={idx} className={`${styles.resultItem} ${r.is_correct ? styles.correctBorder : styles.wrongBorder}`}>
                <p><strong>Câu {idx + 1}:</strong> {r.content}</p>
                <p>Trạng thái: {r.is_correct ? '✅ Đúng' : '❌ Sai'}</p>
                {r.explanation && <p className={styles.explanation}>💡 Giải thích: {r.explanation}</p>}
              </div>
            ))}
          </div>
          <div className={styles.backWrapper}>
            <Link to={`/sets/${id}`} className={styles.backBtn}>Về bộ thẻ</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <TestBoard onSubmitTest={handleSubmit} />
    </div>
  );
};

export default StudyTest;