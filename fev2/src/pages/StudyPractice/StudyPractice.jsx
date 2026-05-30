import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';

import Button from '../../components/ui/Button/Button';
import Input from '../../components/ui/Input/Input';

import '../Study/StudyShared.css'; 
import QuizBoard from '../Study/components/QuizBoard';
import AiChatDrawer from '../Study/components/AiChatDrawer';

const StudyPractice = () => {
  const { deckId } = useParams();
  const navigate = useNavigate();

  const [setupMode, setSetupMode] = useState(true);
  const [numQuestions, setNumQuestions] = useState(10);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const [chatHistory, setChatHistory] = useState([
    { role: 'ai', content: 'Chào bạn! Mình là AI Tutor. Cứ thoải mái chọn đáp án, mình sẽ giải thích chi tiết cho bạn ngay sau đó nhé!' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory]);

  const handleStartPractice = async () => {
    if (numQuestions < 1 || numQuestions > 50) { alert("Nhập số câu từ 1-50"); return; }
    setSetupMode(false);
    setIsLoading(true);

    try {
      const res = await apiClient.post(`/study/${deckId}/practice`, { num_questions: Number(numQuestions) });
      if (res.data.data?.questions) setQuestions(res.data.data.questions);
    } catch (error) {
      alert("Lỗi tải câu hỏi hoặc Hết Quota AI.");
      navigate(`/study/${deckId}`);
    } finally {
      setIsLoading(false);
    }
  };

  const currentQuestion = questions[currentIdx];

  // 🟢 LOGIC MỚI: Truyền optKey vào, không check id cứng nhắc nữa
  const handleSelectOption = (optKey) => {
    if (isAnswered) return;
    setSelectedOptionId(optKey);
    setIsAnswered(true);

    // AI không cần lảm nhảm "Bạn chọn đúng/sai" nữa vì viền đã thể hiện điều đó
    const newMessages = [];
    if (currentQuestion.explanation) {
      newMessages.push({ role: 'ai', content: `**Giải thích:** ${currentQuestion.explanation}` });
    } else {
      newMessages.push({ role: 'ai', content: `Bạn cần mình giải thích thêm về câu này không?` });
    }
    setChatHistory(prev => [...prev, ...newMessages]);
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(p => p + 1);
      setSelectedOptionId(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);

    try {
      const res = await apiClient.post(`/study/${deckId}/chat`, { message: userMsg, chat_history: chatHistory, current_question: currentQuestion });
      setChatHistory(prev => [...prev, { role: 'ai', content: res.data.data.reply }]);
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'ai', content: 'Có lỗi kết nối với AI Tutor.' }]);
    }
  };

  if (setupMode) {
    return (
      <div className="exam-layout" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="setup-card">
          <div className="setup-icon"><span className="material-symbols-outlined">neurology</span></div>
          <h2>Luyện tập với AI</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Chế độ luyện tập nhanh (Không chấm điểm).</p>
          
          <div style={{ textAlign: 'left', marginBottom: '32px' }}>
            <Input 
              label="Số lượng câu hỏi" 
              type="number" 
              value={numQuestions} 
              onChange={(e) => setNumQuestions(e.target.value)} 
              min="1" max="50" 
            />
          </div>
          
          <Button variant="primary" style={{ width: '100%', marginBottom: '12px' }} onClick={handleStartPractice}>
            Bắt đầu luyện tập
          </Button>
          <Button variant="secondary" style={{ width: '100%' }} onClick={() => navigate(`/study/${deckId}`)}>
            Thoát
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) return <div className="exam-layout" style={{ justifyContent: 'center', alignItems: 'center' }}><div className="circular-spinner"></div></div>;

  if (isFinished || questions.length === 0) {
    return (
      <div className="exam-layout" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'var(--accent)' }}>celebration</span>
        <h2 style={{marginTop: '16px'}}>Hoàn thành phiên ôn tập!</h2>
        <Button variant="secondary" style={{ marginTop: '24px' }} onClick={() => navigate(`/study/${deckId}`)}>
          Trở về bộ thẻ
        </Button>
      </div>
    );
  }

  return (
    <div className="exam-layout">
      <header className="exam-header">
        <button className="btn-home" onClick={() => navigate(`/study/${deckId}`)}>
          <span className="material-symbols-outlined">close</span> Thoát
        </button>
        <div style={{ color: 'var(--accent-hover)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-symbols-outlined">neurology</span> AI Practice
        </div>
        <div style={{ width: '80px' }}></div>
      </header>

      <main className="review-layout">
        <section className="review-left custom-scrollbar" style={{ padding: '0 40px', justifyContent: 'center' }}>
          <div className="exam-progress-line" style={{ position: 'relative', width: '100%', maxWidth: '960px', marginBottom: '40px', borderRadius: '4px', overflow: 'hidden' }}>
            <div className="exam-progress-fill" style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}></div>
          </div>
          
          <div style={{ width: '100%', maxWidth: '960px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="question-badge">{currentQuestion.question_type.replace(/_/g, ' ')}</div>
            <div style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Câu {currentIdx + 1} / {questions.length}</div>
          </div>

          <QuizBoard 
            question={currentQuestion} 
            selectedOptionId={selectedOptionId} 
            onSelect={handleSelectOption} 
            onNext={isAnswered ? handleNext : null} 
            isReviewMode={false} 
            isAnswered={isAnswered} 
          />
        </section>

        <AiChatDrawer 
          chatHistory={chatHistory} 
          chatInput={chatInput} 
          setChatInput={setChatInput} 
          onSendChat={handleSendMessage} 
          chatEndRef={chatEndRef} 
        />
      </main>
    </div>
  );
};

export default StudyPractice;