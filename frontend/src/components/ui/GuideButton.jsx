import { useState } from "react";
import { createPortal } from "react-dom";
import styles from "./GuideButton.module.css";

const GuideButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className={styles.guideIcon}
        onClick={() => setIsOpen(true)}
        title="Hướng dẫn sử dụng"
      >
        ❓
      </button>

      {isOpen &&
        createPortal(
          <div className={styles.modalOverlay} onClick={() => setIsOpen(false)}>
            <div
              className={styles.modalContent}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.modalHeader}>
                <h3>📖 Hướng dẫn sử dụng EngVocab</h3>
                <button
                  className={styles.closeBtn}
                  onClick={() => setIsOpen(false)}
                >
                  ✖
                </button>
              </div>
              <div className={styles.modalBody}>
                <h4>⌨️ Phím tắt</h4>
                <ul>
                  <li>
                    <strong>Học lật thẻ (Flashcard):</strong> Mũi tên trái/phải
                    (chuyển thẻ), Space (lật thẻ)
                  </li>
                  <li>
                    <strong>Đánh giá phát âm (Flashcard):</strong> Phím P/p để bắt đầu nghe và đánh giá phát âm của bạn
                  </li>
                  <li>
                    <strong>Luyện tập (Practice):</strong> Phím số 1-4 (chọn đáp
                    án), Enter hoặc N/n (câu tiếp theo)
                  </li>
                  <li>
                    <strong>Trò chơi ghép thẻ (Memory Match):</strong> R/r
                    (reset game)
                  </li>
                  <li>
                    <strong>Pomodoro:</strong> Kéo thả để di chuyển, tự động đếm
                    giờ
                  </li>
                  <li>
                    <strong>Âm thanh:</strong> Nhấn nút trên navbar để bật/tắt
                    nhạc nền
                  </li>
                </ul>
                <h4>📌 Các tính năng chính</h4>
                <ul>
                  <li>
                    <strong>Flashcard:</strong> Học từ vựng với lật thẻ, phát âm
                    tự động
                  </li>
                  <li>
                    <strong>Practice/Test:</strong> AI sinh câu hỏi trắc nghiệm,
                    lưu nháp, tự động nộp
                  </li>
                  <li>
                    <strong>SRS:</strong> Ôn tập ngắt quãng theo thuật toán
                    SM-2, email nhắc nhở
                  </li>
                  <li>
                    <strong>Premium:</strong> Upload PDF, 200 AI/ngày, giao diện
                    độc quyền, hiệu ứng thời tiết
                  </li>
                  <li>
                    <strong>Nghe & viết (Dictation):</strong> Mở từ trang chi
                    tiết bộ thẻ, nhấn nút "🎧 Nghe & viết", nghe phát âm từ và
                    nhập lại chính tả. Hệ thống tự động kiểm tra và chuyển từ
                    tiếp theo.
                  </li>
                  <li>
                    <strong>Game Memory Match:</strong> Ghép cặp từ - nghĩa, 3
                    mạng, confetti
                  </li>
                  <li>
                    <strong>Chat toàn cục:</strong> Nhắn tin với người khác, kéo
                    thả khung chat
                  </li>
                </ul>
                <p>
                  💡{" "}
                  <em>
                    Mọi thắc mắc vui lòng liên hệ admin. Chúc bạn học tập hiệu
                    quả!
                  </em>
                </p>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default GuideButton;
