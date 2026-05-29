import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import './SRSDaily.css';

const SESSION_LIMIT = 30; // Giới hạn 30 từ mỗi phiên học

const SRSDaily = () => {
  const navigate = useNavigate();

  // State quản lý luồng dữ liệu thẻ
  const [allDueCards, setAllDueCards] = useState([]); 
  const [sessionCards, setSessionCards] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Trạng thái hiển thị
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  // Gọi API lấy TẤT CẢ các thẻ cần ôn hôm nay
  const fetchTodayCards = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get('/srs/today');
      const dueCards = res.data.data || [];
      
      setAllDueCards(dueCards);
      
      // Nếu có thẻ, tự động băm 30 thẻ đầu tiên vào session hiện tại
      if (dueCards.length > 0) {
        setSessionCards(dueCards.slice(0, SESSION_LIMIT));
      }
    } catch (error) {
      console.log("Lỗi tải thẻ ôn tập:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayCards();
  }, []);

  // Đánh giá thẻ
  const handleRate = async (rating) => {
    const currentCard = sessionCards[currentIdx];
    
    try {
      // 1. Bắn API lưu tiến độ
      await apiClient.post('/srs/review', {
        flashcard_id: currentCard.flashcard_id,
        rating: rating 
      });

      // 2. Chuyển thẻ
      setIsFlipped(false);
      
      setTimeout(() => {
        if (currentIdx + 1 >= sessionCards.length) {
          // Xong phiên học hiện tại
          setSessionCompleted(true);
          setSessionStarted(false);
          
          // Loại bỏ các thẻ đã học khỏi danh sách tổng
          setAllDueCards(prev => prev.slice(sessionCards.length));
        } else {
          setCurrentIdx(prev => prev + 1);
        }
      }, 150); 
    } catch (error) {
      alert("Lỗi kết nối khi lưu tiến độ!");
    }
  };

  // Nạp thêm thẻ cho phiên mới (Khi người dùng chọn học tiếp)
  const handleContinueStudy = (amount) => {
    const nextBatch = allDueCards.slice(0, amount);
    setSessionCards(nextBatch);
    setCurrentIdx(0);
    setSessionCompleted(false);
    setSessionStarted(true);
  };

  const playAudio = (e, text) => {
    e.stopPropagation(); 
    if (!('speechSynthesis' in window)) return;
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'en-US';
    window.speechSynthesis.speak(utt);
  };

  // ================= RENDER =================

  if (isLoading) {
    return (
      <div className="srs-layout" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="circular-spinner"></div>
      </div>
    );
  }

  // MÀN HÌNH CHUẨN BỊ / HOÀN THÀNH PHIÊN
  if (!sessionStarted) {
    return (
      <div className="srs-layout">
        <header className="srs-header">
          {/* Nút thoát đưa sang trái */}
          <button className="btn-close-srs" onClick={() => navigate('/library')}>
            <span className="material-symbols-outlined">close</span> Thoát
          </button>
          <div className="srs-header-title" style={{ marginLeft: 'auto' }}>
            <span className="material-symbols-outlined">neurology</span> NeuralLearn
          </div>
        </header>

        <main className="srs-main" style={{ justifyContent: 'center' }}>
          <div className="srs-content-wrapper" style={{ alignItems: 'center', textAlign: 'center' }}>
            
            {sessionCompleted ? (
              <div className="srs-setup-box">
                <span className="material-symbols-outlined" style={{ fontSize: '64px', color: '#00e2a0' }}>task_alt</span>
                <h2 style={{ fontSize: '32px', fontWeight: '800' }}>Hoàn thành phiên học!</h2>
                
                {allDueCards.length > 0 ? (
                  <>
                    <p style={{ color: '#8A8A9D', fontSize: '16px', marginBottom: '16px' }}>
                      Bạn vẫn còn <strong>{allDueCards.length}</strong> từ đang chờ ôn tập. Bạn muốn làm gì tiếp theo?
                    </p>
                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                      <button className="btn-start-session" onClick={() => handleContinueStudy(30)}>
                        Học tiếp 30 từ
                      </button>
                      <button className="srs-rate-btn" onClick={() => navigate('/library')}>
                        Nghỉ ngơi (Về thư viện)
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p style={{ color: '#00e2a0', fontSize: '18px', marginBottom: '24px' }}>
                      Tuyệt vời! Bạn đã hoàn thành toàn bộ mục tiêu của ngày hôm nay.
                    </p>
                    <button className="btn-start-session" onClick={() => navigate('/library')}>
                      Trở về thư viện
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="srs-setup-box">
                <h2 style={{ fontSize: '32px', fontWeight: '800' }}>Ôn tập ngắt quãng (SRS)</h2>
                {allDueCards.length > 0 ? (
                  <>
                    <p style={{ color: '#8A8A9D', fontSize: '16px', marginBottom: '24px' }}>
                      Hôm nay bạn có tổng cộng <strong>{allDueCards.length}</strong> từ cần ôn. <br/>
                      Hệ thống sẽ chia nhỏ thành các phiên {SESSION_LIMIT} từ để bạn đỡ mỏi nhé.
                    </p>
                    <button className="btn-start-session" onClick={() => setSessionStarted(true)}>
                      Bắt đầu ôn {Math.min(SESSION_LIMIT, allDueCards.length)} từ
                    </button>
                  </>
                ) : (
                  <>
                    <p style={{ color: '#00e2a0', fontSize: '18px', marginBottom: '24px' }}>
                      Bạn không có từ vựng nào đến hạn ôn tập hôm nay!
                    </p>
                    <button className="btn-start-session" onClick={() => navigate('/library')}>
                      Trở về thư viện
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // MÀN HÌNH HỌC (REVIEW MODE)
  const currentCard = sessionCards[currentIdx];

  return (
    <div className="srs-layout">
      <header className="srs-header">
        <button className="btn-close-srs" onClick={() => navigate('/library')}>
          <span className="material-symbols-outlined">close</span> Thoát
        </button>
        <div className="srs-header-title" style={{ marginLeft: 'auto' }}>
          <span className="material-symbols-outlined">neurology</span> Daily Review
        </div>
      </header>

      <main className="srs-main">
        <div className="srs-content-wrapper">
          
          <section>
            <div className="srs-progress-header">
              <span className="srs-topic-badge">{currentCard.set_title || "Từ vựng tổng hợp"}</span>
              <span style={{ color: '#8A8A9D' }}>Tiến độ: {currentIdx + 1} / {sessionCards.length}</span>
            </div>
            <div className="srs-progress-track">
              <div 
                className="srs-progress-fill" 
                style={{ width: `${((currentIdx) / sessionCards.length) * 100}%` }}
              ></div>
            </div>
          </section>

          <section 
            className={`srs-flashcard-wrapper ${isFlipped ? 'flipped' : ''}`}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div className="srs-flashcard-inner">
              {/* MẶT TRƯỚC */}
              <div className="srs-face srs-front">
                <h3 style={{ fontSize: '48px', fontWeight: '800', marginBottom: '8px' }}>
                  {currentCard.word}
                </h3>
                {currentCard.pronunciation && (
                  <p style={{ fontSize: '18px', color: '#8A8A9D', fontStyle: 'italic' }}>
                    {currentCard.pronunciation}
                  </p>
                )}
                
                <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
                  <button 
                    onClick={(e) => playAudio(e, currentCard.word)}
                    style={{ background: 'none', border: 'none', color: '#8A8A9D', cursor: 'pointer' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>volume_up</span>
                  </button>
                </div>

                <div className="srs-hint-text">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>touch_app</span> 
                  Nhấn để lật thẻ
                </div>
              </div>

              {/* MẶT SAU */}
              <div className="srs-face srs-back">
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '14px', color: '#5a55fa', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', marginBottom: '8px' }}>
                    Nghĩa của từ
                  </h4>
                  <p style={{ fontSize: '24px', fontWeight: '500' }}>{currentCard.meaning}</p>
                </div>
                
                {currentCard.example_sentence && (
                  <div>
                    <h4 style={{ fontSize: '14px', color: '#5a55fa', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600', marginBottom: '8px' }}>
                      Ví dụ
                    </h4>
                    <p style={{ fontSize: '18px', color: '#c7c4d8', fontStyle: 'italic' }}>
                      "{currentCard.example_sentence}"
                    </p>
                  </div>
                )}
                
                <div className="srs-hint-text">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>touch_app</span> 
                  Nhấn để úp lại
                </div>
              </div>
            </div>
          </section>

          {/* 4 NÚT ĐÁNH GIÁ (LUÔN BẬT DÙ LẬT HAY CHƯA LẬT THẺ) */}
          <section className="srs-rating-grid">
            <button className="srs-rate-btn again" onClick={() => handleRate('AGAIN')}>Again</button>
            <button className="srs-rate-btn hard" onClick={() => handleRate('HARD')}>Hard</button>
            <button className="srs-rate-btn good" onClick={() => handleRate('GOOD')}>Good</button>
            <button className="srs-rate-btn easy" onClick={() => handleRate('EASY')}>Easy</button>
          </section>

        </div>
      </main>
    </div>
  );
};

export default SRSDaily;