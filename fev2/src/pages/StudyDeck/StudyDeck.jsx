import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import './StudyDeck.css';

const MOCK_HISTORY = [
  { id: 1, score: 80, total_questions: 5, correct_count: 4, started_at: "2026-05-22T16:23:08.000Z", completed_at: "2026-05-22T16:30:57.000Z", status: "COMPLETED" },
  { id: 2, score: null, total_questions: 10, correct_count: 0, started_at: "2026-05-23T09:15:00.000Z", completed_at: null, status: "IN_PROGRESS" },
  { id: 3, score: 100, total_questions: 20, correct_count: 20, started_at: "2026-05-20T18:45:00.000Z", completed_at: "2026-05-20T19:05:00.000Z", status: "COMPLETED" },
];

const formatDate = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const StudyDeck = () => {
  const { deckId } = useParams();
  const navigate = useNavigate();

  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [rememberedCount, setRememberedCount] = useState(0);

  const [historyList, setHistoryList] = useState([]);

  const currentCard = cards[currentIdx];

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get(`/flashcard-sets/${deckId}`);
        const d = res.data.data;
        setDeck(d);
        setCards([...(d.flashcards || [])]);

        // 🟢 CHÈN THÊM DÒNG NÀY ĐỂ GỌI API LẤY LỊCH SỬ THI THẬT (API 6)
        const historyRes = await apiClient.get(`/study/tests/history/${deckId}`);
        setHistoryList(historyRes.data.data || []);

      } catch {
        console.error('Failed to load deck');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [deckId]);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get(`/flashcard-sets/${deckId}`);
        const d = res.data.data;
        setDeck(d);
        setCards([...(d.flashcards || [])]);
      } catch {
        console.error('Failed to load deck');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [deckId]);

  const speak = useCallback((text) => {
    if (!('speechSynthesis' in window) || !text) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'en-US';
    utt.rate = 0.9;
    utt.pitch = 1.1;
    const voices = window.speechSynthesis.getVoices();
    const usFemaleVoice = voices.find(v => v.lang === 'en-US' && (v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Zira')));
    if (usFemaleVoice) utt.voice = usFemaleVoice;
    window.speechSynthesis.speak(utt);
  }, []);

  useEffect(() => {
    if (autoSpeak && currentCard && !isFlipped) {
      const t = setTimeout(() => speak(currentCard.word), 350);
      return () => clearTimeout(t);
    }
  }, [currentIdx, autoSpeak, currentCard, isFlipped, speak]);

  useEffect(() => {
    const onKey = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.code === 'Space') { e.preventDefault(); setIsFlipped(f => !f); }
      if (e.code === 'ArrowRight') goNext();
      if (e.code === 'ArrowLeft') goPrev();
      if (e.code === 'Escape' && isFullscreen) setIsFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentIdx, cards.length, isFullscreen]);

  const goNext = () => { if (currentIdx < cards.length - 1) { setCurrentIdx(i => i + 1); setIsFlipped(false); } };
  const goPrev = () => { if (currentIdx > 0) { setCurrentIdx(i => i - 1); setIsFlipped(false); } };

  const handleForgot = (e) => {
    e.stopPropagation();
    const next = [...cards];
    const [card] = next.splice(currentIdx, 1);
    next.push(card);
    setCards(next);
    setIsFlipped(false);
    if (currentIdx >= next.length) setCurrentIdx(0);
  };

  const handleRemembered = (e) => {
    e.stopPropagation();
    const newCount = rememberedCount + 1;
    setRememberedCount(newCount);
    if (currentIdx + 1 >= cards.length) { setIsDone(true); return; }
    setCurrentIdx(i => i + 1);
    setIsFlipped(false);
  };

  if (isLoading) return <div className="study-loading"><div className="circular-spinner" /></div>;
  if (!deck || cards.length === 0) return <div className="study-empty"><p>No cards available.</p></div>;

  return (
    <div className={`study-page ${isFullscreen ? 'is-fullscreen' : ''}`}>

      {/* TIÊU ĐỀ ĐÃ ĐƯỢC TÁCH BIỆT KHỎI NÚT QUAY LẠI */}
      {!isFullscreen && (
        <div className="study-navigation-flow">
          <button className="btn-back-link" onClick={() => navigate('/library')}>
            <span className="material-symbols-outlined">arrow_back</span> Back to Library
          </button>
          <div className="study-title-block">
            <h2>{deck.title}</h2>
            <p>{deck.total_cards} cards • Active Session</p>
          </div>
        </div>
      )}

      {/* CHỌN CHẾ ĐỘ HỌC */}
      {!isFullscreen && (
        <div className="study-modes">
          <button className="mode-btn active">
            <span className="material-symbols-outlined">layers</span> Card Flip
          </button>
          <button className="mode-btn" onClick={() => navigate(`/practice/${deckId}`)}>
            <span className="material-symbols-outlined">autorenew</span> Practice
          </button>
          <button className="mode-btn" onClick={() => navigate(`/test/${deckId}`)}>
            <span className="material-symbols-outlined">quiz</span> Test
          </button>
        </div>
      )}

      <div className="study-main">
        {isDone ? (
          <div className="session-done-card">
            <span className="material-symbols-outlined done-icon">celebration</span>
            <h3>Session Completed!</h3>
            <p>You remembered <strong>{rememberedCount}</strong> / {deck.total_cards} words</p>
            <div className="done-actions">
              <button className="btn-restart" onClick={handleRestart}>Study Again</button>
              <button className="btn-back-lib" onClick={() => navigate('/library')}>Library</button>
            </div>
          </div>
        ) : (
          /* LỚP BOARD NGOÀI CÙNG CHỨA CẢ PLAYER (MÀU SURFACE) */
          <div className="study-board">

            {/* FLASHCARD PLAYER BÊN TRONG (MÀU SIDEBAR) */}
            <div className="flashcard-wrapper" onClick={() => setIsFlipped(f => !f)}>
              <div className={`flashcard-3d ${isFlipped ? 'flipped' : ''}`}>

                {/* MẶT TRƯỚC */}
                <div className="card-face card-front">
                  <div className="card-top-actions">
                    <span className="card-pos-badge">{currentCard.part_of_speech || 'word'}</span>
                    <button className="btn-card-speak" onClick={(e) => { e.stopPropagation(); speak(currentCard.word); }}>
                      <span className="material-symbols-outlined">volume_up</span>
                    </button>
                  </div>
                  <div className="card-center">
                    <p className="card-word">{currentCard.word}</p>
                    {currentCard.pronunciation && <p className="card-pronunciation">{currentCard.pronunciation}</p>}
                  </div>
                  <p className="card-hint">Press [Space] to flip card</p>
                </div>

                {/* MẶT SAU */}
                <div className="card-face card-back">
                  <div className="card-top-actions">
                    <span className="card-pos-badge">{currentCard.part_of_speech || 'meaning'}</span>
                    <button className="btn-card-speak" onClick={(e) => { e.stopPropagation(); speak(currentCard.word); }}>
                      <span className="material-symbols-outlined">volume_up</span>
                    </button>
                  </div>
                  <div className="card-center">
                    <p className="card-meaning">{currentCard.meaning}</p>
                    {currentCard.example_sentence && <p className="card-example">"{currentCard.example_sentence}"</p>}
                  </div>
                  <p className="card-hint">Press [Space] to flip back</p>
                </div>

              </div>
            </div>

            {/* SRS CONTROL BAR (ĐÃ ĐƯỢC BỌC TRONG DIV RIÊNG BIỆT) */}
            <div className="srs-bar">
              <div className="srs-bar-left">
                <span className="srs-count">{currentIdx + 1} / {cards.length}</span>
              </div>

              {/* Bọc cụm nút điều hướng hành động sát nhau */}
              <div className="srs-bar-center-actions">
                <button className="btn-control-nav" onClick={goPrev} disabled={currentIdx === 0}>
                  <span className="material-symbols-outlined">chevron_left</span> Previous
                </button>
                <button className="btn-control-action btn-forgot-card" onClick={handleForgot}>Forgot</button>
                <button className="btn-control-action btn-remembered-card" onClick={handleRemembered}>Remembered</button>
                <button className="btn-control-nav" onClick={goNext} disabled={currentIdx === cards.length - 1}>
                  Next <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>

              <div className="srs-bar-right">
                <button className={`btn-icon-action ${autoSpeak ? 'active' : ''}`} onClick={() => setAutoSpeak(a => !a)}>
                  <span className="material-symbols-outlined">{autoSpeak ? 'volume_up' : 'volume_off'}</span>
                </button>
                <button className="btn-icon-action" onClick={() => setIsFullscreen(!isFullscreen)}>
                  <span className="material-symbols-outlined">{isFullscreen ? 'fullscreen_exit' : 'fullscreen'}</span>
                </button>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* RECENT TEST ATTEMPTS */}
      {!isFullscreen && (
        <section className="history-section">
          <div className="history-header">
            <span className="material-symbols-outlined">history</span>
            <h3>Recent Test Attempts</h3>
          </div>
          {/* Thay thế toàn bộ đoạn map MOCK_HISTORY cũ bằng đoạn này */}
          <div className="history-list">
  {historyList.map(h => (
    /* 🟢 Đã sửa key={h.id} thành key={h.attempt_id} */
    <div key={h.attempt_id} className="history-row">
      <div className="history-info">
        <span className="history-date">Started: {formatDate(h.started_at)}</span>
        <div className="history-meta">
          <span><span className="material-symbols-outlined">quiz</span> {h.total_questions} Questions</span>
          {h.status === 'COMPLETED' && (
            <span><span className="material-symbols-outlined">check_circle</span> {h.correct_count} Correct</span>
          )}
        </div>
      </div>
      <div className="history-right">
        {h.status === 'COMPLETED' ? (
          <>
            <span className={`history-score ${h.score >= 80 ? 'good' : h.score >= 50 ? 'mid' : 'bad'}`}>{h.score}%</span>
            {/* 🟢 Đã sửa h.id thành h.attempt_id ở trong URL navigate */}
            <button 
              className="btn-history-action btn-view-result" 
              onClick={() => navigate(`/test/${deckId}/result/${h.attempt_id}`)}
            >
              Xem chi tiết &gt;
            </button>
          </>
        ) : (
          <>
            <span className="history-badge-pending">IN PROGRESS</span>
            <button className="btn-history-action btn-resume-test" onClick={() => navigate(`/test/${deckId}`)}>
              Resume &gt;
            </button>
          </>
        )}
      </div>
    </div>
  ))}
</div>
        </section>
      )}
    </div>
  );
};

export default StudyDeck;