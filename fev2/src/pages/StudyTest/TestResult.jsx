import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../services/apiClient';

import '../Study/StudyShared.css'; 
import QuizBoard from '../Study/components/QuizBoard';
import AiChatDrawer from '../Study/components/AiChatDrawer';

const TestResult = () => {
  const { deckId, attemptId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { resultData: navResult, questionsData: navQuestions, userAnswers: navAnswers, timeSpent: navTime } = location.state || {};

  const [resultData, setResultData] = useState(navResult || null);
  const [questionsData, setQuestionsData] = useState(navQuestions || null);
  const [userAnswers, setUserAnswers] = useState(navAnswers || {});
  
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [dashOffset, setDashOffset] = useState(691);
  const [activeQuestion, setActiveQuestion] = useState(null);

  const [chatHistory, setChatHistory] = useState([{ role: 'ai', content: 'Chào bạn! Mình đã phân tích bài thi. Nếu có câu nào chưa hiểu, hãy nhấn **"Hỏi AI câu này"** ở góc phải câu hỏi nhé!' }]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (!questionsData && attemptId) {
      apiClient.get(`/study/tests/attempts/${attemptId}`).then(res => {
        const data = res.data.data;
        setResultData(data);
        setQuestionsData(data.questions);
        const answersMap = {};
        if (Array.isArray(data.questions)) {
          data.questions.forEach(q => { answersMap[q.id] = q.selected_option_id; });
        }
        setUserAnswers(answersMap);
      }).catch(() => navigate('/library'));
    }
  }, [attemptId, questionsData, navigate]);

  // 🟢 BẢO VỆ CRASH: Tính điểm an toàn
  useEffect(() => {
    if (resultData && resultData.score !== undefined) {
      const scoreNum = Number(resultData.score) || 0;
      const timer = setTimeout(() => setDashOffset(691 * (1 - (scoreNum / 100))), 100);
      return () => clearTimeout(timer);
    }
  }, [resultData]);

  const handleSendChat = async (e, customMsg = null) => {
    if (e) e.preventDefault();
    const msg = customMsg || chatInput.trim();
    if (!msg) return;

    setChatInput('');
    const newChatHistory = [...chatHistory, { role: 'user', content: msg }];
    setChatHistory(newChatHistory);

    try {
      const res = await apiClient.post(`/study/${deckId}/chat`, { message: msg, chat_history: newChatHistory, current_question: activeQuestion });
      setChatHistory(prev => [...prev, { role: 'ai', content: res.data.data.reply }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'ai', content: 'AI đang bận, vui lòng thử lại sau.' }]);
    }
  };

  const askAboutQuestion = (q) => {
    setActiveQuestion(q);
    handleSendChat(null, `Giải thích chi tiết câu này giúp tôi: "${q.content}"`);
  };

  const startReviewMode = () => {
    setIsReviewMode(true);
    if(resultData?.ai_insight) {
      setChatHistory(prev => [...prev, { role: 'ai', content: `**Đánh giá tổng quan:** ${resultData.ai_insight}` }]);
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds === undefined) return '0m 0s';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  if (!resultData || !questionsData) {
    return <div className="exam-layout" style={{justifyContent: 'center', alignItems: 'center'}}><div className="circular-spinner"></div></div>;
  }

  // ==========================================
  // REVIEW MODE
  // ==========================================
  if (isReviewMode) {
    return (
      <div className="exam-layout">
        <header className="exam-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <button className="btn-home" onClick={() => navigate(`/library`)}>
              <span className="material-symbols-outlined">home</span> Thư viện
            </button>
            <button className="exam-btn-secondary" style={{ padding: '8px 16px', display: 'flex', gap: '8px', alignItems: 'center', background: 'transparent', border: 'none' }} onClick={() => setIsReviewMode(false)}>
              <span className="material-symbols-outlined">arrow_back</span> Về tổng kết
            </button>
          </div>
          <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '18px' }}>Chi tiết bài làm</div>
          <div style={{ width: '120px' }}></div>
        </header>

        <div className="review-layout">
          <div className="review-left custom-scrollbar">
            <div className="exam-content-wrapper" style={{ maxWidth: '800px', paddingBottom: '40px' }}>
              {Array.isArray(questionsData) && questionsData.map((q, idx) => {
                const answerResult = resultData.results?.find(r => r.question_id === q.id) || resultData.results?.[q.id] || q;

                return (
                  <div key={q.id} className="exam-question-card" style={{ textAlign: 'left', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                      <span className="question-badge">Câu {idx + 1}</span>
                    </div>
                    
                    <QuizBoard 
                      question={q} 
                      selectedOptionId={userAnswers[q.id] || answerResult?.selected_option_id} 
                      isReviewMode={true} 
                      answerResult={answerResult} 
                    />
                    
                    {answerResult?.explanation && (
                       <div style={{ marginTop: '20px', padding: '20px', backgroundColor: 'var(--sidebar)', borderRadius: '10px', border: '1px solid var(--border-subtle)', color: 'var(--text-main)', fontSize: '15px', lineHeight: 1.6 }}>
                         <strong style={{ color: 'var(--accent-hover)' }}>Giải thích: </strong> {answerResult.explanation}
                       </div>
                    )}
                    <div style={{ textAlign: 'right', marginTop: '16px' }}>
                      <button className="btn-ask-ai" onClick={() => askAboutQuestion(q)}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>psychology</span> Hỏi AI câu này
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <AiChatDrawer 
            chatHistory={chatHistory} chatInput={chatInput} setChatInput={setChatInput} 
            onSendChat={handleSendChat} chatEndRef={chatEndRef} 
          />
        </div>
      </div>
    );
  }

  // ==========================================
  // TỔNG KẾT BÀI THI
  // ==========================================
  const displayScore = Number(resultData.score) || 0;

  return (
    <div className="exam-layout" style={{ justifyContent: 'center', padding: '40px', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '32px', left: '48px' }}>
        <button className="btn-home" onClick={() => navigate(`/library`)}>
          <span className="material-symbols-outlined">home</span> Thư viện
        </button>
      </div>

      <div className="result-hero">
        <div className="score-ring-container">
          <svg className="score-ring-svg" viewBox="0 0 256 256">
            <circle className="score-ring-bg" cx="128" cy="128" r="110" fill="transparent" strokeWidth="12" />
            <circle className="score-ring-fill" cx="128" cy="128" r="110" fill="transparent" strokeWidth="12" strokeLinecap="round" strokeDasharray="691" style={{ strokeDashoffset: dashOffset }} />
          </svg>
          <div className="score-text-absolute">{displayScore}%</div>
        </div>

        <h1 style={{ fontSize: '32px', fontWeight: '800' }}>Đã hoàn thành bài kiểm tra!</h1>
        
        <div className="stats-row">
          <div className="stat-item"><span className="material-symbols-outlined">check_circle</span> {resultData.correct_count}/{resultData.total_questions} Chính xác</div>
          {navTime !== undefined && !isNaN(navTime) && (
            <div className="stat-item"><span className="material-symbols-outlined">schedule</span> Thời gian: {formatTime(navTime)}</div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '16px', marginTop: '40px' }}>
          <button className="exam-btn-primary" onClick={startReviewMode}>Chi tiết bài làm (AI Review) ✨</button>
          <button className="exam-btn-secondary" onClick={() => navigate(`/study/${deckId}`)}>Lịch sử thi</button>
          <button className="exam-btn-secondary" style={{ background: 'transparent', border: 'none' }} onClick={() => navigate(`/test/${deckId}`)}>Thử lại</button>
        </div>
      </div>
    </div>
  );
};

export default TestResult;