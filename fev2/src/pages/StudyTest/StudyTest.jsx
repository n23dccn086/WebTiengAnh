import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';

// IMPORT UI COMPONENTS
import Button from '../../components/ui/Button/Button';
import Input from '../../components/ui/Input/Input';

import '../Study/StudyShared.css';
import QuizBoard from '../Study/components/QuizBoard';

const TEST_DURATION_SECONDS = 15 * 60; 

const StudyTest = () => {
  const { deckId } = useParams();
  const navigate = useNavigate();

  const [setupMode, setSetupMode] = useState(true);
  const [numQuestions, setNumQuestions] = useState(15);
  
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const [userAnswers, setUserAnswers] = useState({});
  const [attemptId, setAttemptId] = useState(null);
  
  const [timeLeft, setTimeLeft] = useState(TEST_DURATION_SECONDS);
  const [isTimeUp, setIsTimeUp] = useState(false);

  const answersRef = useRef(userAnswers);
  useEffect(() => { answersRef.current = userAnswers; }, [userAnswers]);

  // 🟢 TỰ ĐỘNG RESUME NẾU F5 TRONG LÚC ĐANG THI
  useEffect(() => {
    if (localStorage.getItem(`active_test_deck_${deckId}`)) {
      handleStartTest(true); 
    }
  }, [deckId]);

  const handleStartTest = async (isAutoResume = false) => {
    if (!isAutoResume && (numQuestions < 1 || numQuestions > 50)) { alert("Nhập số câu từ 1-50"); return; }
    setSetupMode(false);
    setIsLoading(true);

    try {
      const res = await apiClient.post(`/study/${deckId}/test`, { num_questions: Number(numQuestions) });
      const aId = res.data.data.attempt_id;
      setAttemptId(aId);
      setQuestions(res.data.data.questions);

      // Đánh dấu là deck này đang có bài thi hoạt động
      localStorage.setItem(`active_test_deck_${deckId}`, 'true');

      const savedAnswers = localStorage.getItem(`test_answers_${aId}`);
      if (savedAnswers) setUserAnswers(JSON.parse(savedAnswers));

      const savedEndTime = localStorage.getItem(`test_end_${aId}`);
      if (savedEndTime) {
        setTimeLeft(Math.max(0, Math.floor((parseInt(savedEndTime) - Date.now()) / 1000)));
      } else {
        localStorage.setItem(`test_end_${aId}`, Date.now() + TEST_DURATION_SECONDS * 1000);
        setTimeLeft(TEST_DURATION_SECONDS);
      }
    } catch (error) {
      alert("Lỗi tải đề thi hoặc Hết Quota AI!");
      localStorage.removeItem(`active_test_deck_${deckId}`);
      navigate(`/library`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoading || isTimeUp || timeLeft <= 0 || setupMode) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timer); setIsTimeUp(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isLoading, isTimeUp, timeLeft, setupMode]);

  useEffect(() => {
    if (isTimeUp) { alert("Hết thời gian! Tự động nộp bài."); handleSubmitTest(); }
  }, [isTimeUp]);

  useEffect(() => {
    if (!attemptId) return;
    const autoSaveInterval = setInterval(async () => {
      const currentAnswersArray = Object.entries(answersRef.current).map(([qId, optId]) => ({ question_id: parseInt(qId), selected_option_id: optId }));
      if (currentAnswersArray.length === 0) return;
      try { await apiClient.patch(`/study/tests/${attemptId}/auto-save`, { answers: currentAnswersArray }); } catch (err) {}
    }, 30000);
    return () => clearInterval(autoSaveInterval);
  }, [attemptId]);

  const handleSelectOption = (optionId) => {
    setUserAnswers(prev => {
      const next = { ...prev, [currentQuestion.id]: optionId };
      localStorage.setItem(`test_answers_${attemptId}`, JSON.stringify(next));
      return next;
    });
  };

  const handleNext = () => setCurrentIdx(p => Math.min(questions.length - 1, p + 1));
  const handlePrev = () => setCurrentIdx(p => Math.max(0, p - 1));

  const handleSubmitTest = async () => {
    if (!isTimeUp) {
      const answeredCount = Object.keys(userAnswers).length;
      if (answeredCount < questions.length && !window.confirm(`Bạn mới làm ${answeredCount}/${questions.length} câu. Chắc chắn nộp bài?`)) return;
      else if (answeredCount === questions.length && !window.confirm("Nộp bài thi và xem kết quả?")) return;
    }
    
    // TÌM ĐOẠN NÀY VÀ THÊM userAnswers VÀO:
    try {
      const res = await apiClient.post(`/study/tests/${attemptId}/submit`);
      localStorage.removeItem(`active_test_deck_${deckId}`);
      localStorage.removeItem(`test_end_${attemptId}`);
      localStorage.removeItem(`test_answers_${attemptId}`);
      
      navigate(`/test/${deckId}/result/${attemptId}`, { 
        state: { 
          resultData: res.data.data, 
          questionsData: questions, 
          userAnswers: userAnswers, /* 🟢 THÊM ĐÚNG DÒNG NÀY VÀO */
          timeSpent: TEST_DURATION_SECONDS - timeLeft 
        } 
      });
    } catch (error) { alert("Lỗi kết nối khi nộp bài!"); }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0m 0s';
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (setupMode) {
    return (
      <div className="exam-layout" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="setup-card">
          <div className="setup-icon"><span className="material-symbols-outlined">quiz</span></div>
          <h2>Bắt đầu bài thi AI</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>AI sẽ chấm điểm và cập nhật chỉ số ghi nhớ của bạn.</p>
          
          <div style={{ textAlign: 'left', marginBottom: '32px' }}>
            {/* SỬ DỤNG COMPONENT INPUT & BUTTON ĐỂ KHÔNG BỊ VỠ GIAO DIỆN NHƯ TRONG ẢNH */}
            <Input 
              label="Số lượng câu hỏi (Tối đa 50)" 
              type="number" 
              value={numQuestions} 
              onChange={(e) => setNumQuestions(e.target.value)} 
              min="1" max="50" 
            />
          </div>
          <Button variant="primary" style={{ width: '100%', marginBottom: '12px' }} onClick={() => handleStartTest(false)}>
            Bắt đầu thi ngay
          </Button>
          <Button variant="secondary" style={{ width: '100%' }} onClick={() => navigate(`/library`)}>
            Quay lại thư viện
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || questions.length === 0) return <div className="exam-layout" style={{ justifyContent: 'center', alignItems: 'center' }}><div className="circular-spinner"></div></div>;

  const currentQuestion = questions[currentIdx];

  return (
    <div className="exam-layout">
      <header className="exam-header">
        <div className="exam-progress-line"><div className="exam-progress-fill" style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}></div></div>
        
        <button className="btn-home" onClick={() => navigate(`/library`)}>
          <span className="material-symbols-outlined">home</span> Thư viện
        </button>
        
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          <div className="question-badge" style={{ marginBottom: 0 }}>
            Question {currentIdx + 1} <span style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>/ {questions.length}</span>
          </div>
        </div>

        <div className={`exam-timer ${timeLeft <= 60 ? 'warning' : ''}`}>
          <span className="material-symbols-outlined">timer</span>
          <span style={{ fontSize: '20px', fontWeight: '700', fontVariantNumeric: 'tabular-nums' }}>{formatTime(timeLeft)}</span>
        </div>
      </header>

      <main className="exam-main custom-scrollbar">
        <div className="exam-ambient-glow"></div>
        <QuizBoard 
          question={currentQuestion} 
          selectedOptionId={userAnswers[currentQuestion.id]} 
          onSelect={handleSelectOption} 
          onNext={handleNext} 
          isReviewMode={false} 
        />
      </main>

      <footer className="exam-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600 }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--accent)' }}>sync</span> Auto-saving...
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="exam-btn-secondary" onClick={handlePrev} disabled={currentIdx === 0}>Quay lại</button>
          
          {/* NÚT BỎ QUA ĐỒNG BỘ CSS */}
          <button className="exam-btn-secondary" onClick={handleNext}>Bỏ qua</button>
          
          {currentIdx < questions.length - 1 ? (
            <button className="exam-btn-secondary" onClick={handleNext}>Tiếp theo</button>
          ) : (
            <button className="exam-btn-primary" onClick={handleSubmitTest}>Nộp bài</button>
          )}
        </div>
      </footer>
    </div>
  );
};

export default StudyTest;