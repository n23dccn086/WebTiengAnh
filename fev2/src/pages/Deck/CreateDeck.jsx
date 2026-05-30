import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import useAuthStore from '../../store/authStore';

// Components
import FlashcardItem from './components/FlashcardItem';
import LeaveModal from './components/LeaveModal';
import './CreateDeck.css';

const CreateDeck = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { user, loginSuccess } = useAuthStore();

  const [deckData, setDeckData] = useState({ title: '', description: '', service_id: 1 });
  const [cards, setCards] = useState([{ word: '', meaning: '', pronunciation: '', example_sentence: '', suggestionData: null, isDeleting: false }]);
  const [isAutoFetch, setIsAutoFetch] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [toast, setToast] = useState({ type: '', message: '', visible: false });
  const [isDirty, setIsDirty] = useState(false);
  const [leaveModal, setLeaveModal] = useState({ visible: false, targetPath: '' });

  const markDirty = () => setIsDirty(true);

  // ==========================================
  // THUẬT TOÁN CHẶN CHUYỂN TRANG TUYỆT ĐỐI
  // ==========================================
  useEffect(() => {
    // 1. Chặn người dùng ấn F5 hoặc Tắt tab trình duyệt
    const handleBeforeUnload = (e) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // 2. Chặn người dùng bấm vào các Link ở thanh Menu Sidebar (Dùng Capture phase)
    const handleGlobalClick = (e) => {
      if (!isDirty) return;
      
      const targetLink = e.target.closest('a'); // Tìm thẻ <a> gần nhất bị click
      if (targetLink) {
        const href = targetLink.getAttribute('href');
        
        // Nếu là link chuyển trang nội bộ và khác trang hiện tại
        if (href && href.startsWith('/') && href !== window.location.pathname) {
          e.preventDefault();
          e.stopPropagation(); // Giết chết sự kiện, không cho React Router chạy
          setLeaveModal({ visible: true, targetPath: href }); // Bật Modal siêu đẹp lên
        }
      }
    };
    
    // Gắn sự kiện ở mức cao nhất (document) và ưu tiên chạy trước (true)
    document.addEventListener('click', handleGlobalClick, true);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleGlobalClick, true);
    };
  }, [isDirty]);

  const showToast = useCallback((type, message) => {
    setToast({ type, message, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 4000);
  }, []);

  const handleDeckChange = (e) => { setDeckData({ ...deckData, [e.target.name]: e.target.value }); markDirty(); };
  
  const handleCardChange = (index, field, value) => {
    const newCards = [...cards];
    newCards[index][field] = value;
    if (field === 'word') newCards[index].suggestionData = null;
    setCards(newCards);
    markDirty();
  };

  const addCard = () => { setCards([...cards, { word: '', meaning: '', pronunciation: '', example_sentence: '', suggestionData: null, isDeleting: false }]); markDirty(); };
  
  const removeCard = (index) => {
    const newCards = [...cards];
    newCards[index].isDeleting = true;
    setCards(newCards);
    setTimeout(() => setCards(prev => prev.filter((_, i) => i !== index)), 300);
    markDirty();
  };

  const handleWordBlur = async (index) => {
    const word = cards[index].word.trim();
    if (!word || cards[index].meaning.trim()) return;
    const newCards = [...cards];

    if (isAutoFetch) {
      try {
        const res = await apiClient.post('/flashcards/auto-fill', { word });
        if (res.data.data) {
          const d = res.data.data;
          newCards[index] = { ...newCards[index], meaning: d.meaning || '', pronunciation: d.pronunciation || '', example_sentence: d.example_sentence || '' };
          markDirty();
        }
      } catch { console.log('Lỗi từ điển'); }
    } else {
      try {
        const res = await apiClient.get('/flashcards/suggest', { params: { word } });
        newCards[index].suggestionData = res.data.data || null;
      } catch { console.log('Lỗi lấy đề xuất'); }
    }
    setCards(newCards);
  };

  const applySuggestion = (index) => {
    const newCards = [...cards];
    const d = newCards[index].suggestionData;
    if (!d) return;
    newCards[index] = { ...newCards[index], meaning: d.meaning || '', pronunciation: d.pronunciation || '', example_sentence: d.example_sentence || '', suggestionData: null };
    setCards(newCards);
    markDirty();
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsExtracting(true);
    showToast('info', 'AI đang đọc tài liệu của bạn...');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', deckData.title || 'PDF Imported');
    formData.append('service_id', deckData.service_id);
    try {
      const res = await apiClient.post('/flashcard-sets/pdf-extract/preview', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      loginSuccess({ ...user, ai_quota: user.ai_quota - 1 }, localStorage.getItem('accessToken'), localStorage.getItem('refreshToken'));
      if (!deckData.title) setDeckData({ ...deckData, title: res.data.data.set_title || 'PDF Extracted Deck' });
      
      const formattedCards = res.data.data.flashcards.map(c => ({ ...c, suggestionData: null, isDeleting: false }));
      setCards(prev => {
        const existing = prev.filter(c => c.word.trim() || c.meaning.trim());
        return existing.length > 0 ? [...existing, ...formattedCards] : formattedCards;
      });
      markDirty();
      showToast('success', `Đã trích xuất thành công ${formattedCards.length} từ!`);
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Có lỗi xảy ra khi xử lý file PDF.');
    } finally {
      setIsExtracting(false);
      e.target.value = null;
    }
  };

  const handleSaveDeck = async () => {
    if (!deckData.title) { showToast('error', 'Vui lòng nhập Tên bộ thẻ.'); return; }
    const validCards = cards.filter(c => c.word.trim() && c.meaning.trim() && !c.isDeleting);
    if (validCards.length === 0) { showToast('error', 'Vui lòng điền hoàn chỉnh Từ vựng và Ý nghĩa.'); return; }
    setIsLoading(true);
    showToast('info', 'Đang lưu bộ thẻ vào thư viện...');
    try {
      const resSet = await apiClient.post('/flashcard-sets', deckData);
      const setId = resSet.data.data.id;
      // THAY THẾ BẰNG ĐOẠN CODE NÀY:
    await Promise.all(validCards.map(card => {
      // Tách 2 trường frontend ra, chỉ gộp các trường hợp lệ (word, meaning...) gửi xuống API
      const { suggestionData, isDeleting, ...validApiData } = card;
      return apiClient.post('/flashcards', { ...validApiData, set_id: setId });
    }));
      setIsDirty(false); // Thành công thì bỏ chặn
      showToast('success', 'Tạo bộ thẻ thành công! Đang chuyển hướng...');
      setTimeout(() => navigate('/library'), 1500);
    } catch {
      showToast('error', 'Có lỗi xảy ra khi lưu bộ thẻ.');
      setIsLoading(false);
    }
  };

  // Hành động của Modal
  const confirmLeave = () => {
    setIsDirty(false);
    setLeaveModal({ visible: false, targetPath: '' });
    navigate(leaveModal.targetPath);
  };

  const confirmSaveAndLeave = () => {
    setLeaveModal(prev => ({ ...prev, visible: false }));
    handleSaveDeck(); // Lưu xong tự redirect luôn
  };

  return (
    <div className="create-deck-container">
      {toast.visible && <div className={`toast-notification ${toast.type}`}><p>{toast.message}</p></div>}
      
      {isExtracting && (
        <div className="global-loader-overlay">
          <div className="circular-spinner"></div>
          <p>AI đang bóc tách tài liệu...</p>
        </div>
      )}

      {/* RENDER MODAL JSX SIÊU ĐẸP Ở ĐÂY */}
      {leaveModal.visible && (
        <LeaveModal 
          onSaveAndLeave={confirmSaveAndLeave}
          onDiscard={confirmLeave}
          onCancel={() => setLeaveModal({ visible: false, targetPath: '' })}
        />
      )}

      <header className="page-header">
        <h1>Tạo bộ thẻ</h1>
        <p>Thiết kế module học tập của bạn.</p>
      </header>

      {/* THANH ĐIỀU KHIỂN NỔI - TRẢ LẠI GIAO DIỆN CŨ CỰC GỌN */}
      <div className="command-center-wrapper">
        <div className="command-center glass-panel">
          <input type="file" accept="application/pdf" ref={fileInputRef} onChange={handlePdfUpload} style={{ display: 'none' }} />
          <button className="btn-pdf-magic" onClick={() => fileInputRef.current.click()} disabled={isExtracting}>
            <span className="material-symbols-outlined">auto_awesome</span>
            {isExtracting ? 'Đang phân tích...' : 'Trích xuất từ PDF'}
          </button>
          
          <div className="divider-vertical"></div>
          
          <div className="toggle-group">
            <span>Tự động điền API</span>
            <label className="switch">
              <input type="checkbox" checked={isAutoFetch} onChange={(e) => setIsAutoFetch(e.target.checked)} />
              <span className="slider round"></span>
            </label>
          </div>
        </div>
      </div>

      <section className="deck-info-section glass-panel">
        <div className="input-row">
          <div className="input-group">
            <label>Tên bộ thẻ</label>
            <input type="text" name="title" className="modern-input" placeholder="VD: IELTS Vocabulary..." value={deckData.title} onChange={handleDeckChange} />
          </div>
          <div className="input-group">
            <label>Mô tả ngắn</label>
            <input type="text" name="description" className="modern-input" placeholder="Bạn định học gì..." value={deckData.description} onChange={handleDeckChange} />
          </div>
        </div>
      </section>

      <div className="cards-list">
        {cards.map((card, index) => (
          <FlashcardItem 
            key={index}
            card={card}
            index={index}
            totalCards={cards.length}
            isAutoFetch={isAutoFetch}
            onChange={handleCardChange}
            onBlur={handleWordBlur}
            onRemove={removeCard}
            onApplySuggestion={applySuggestion}
          />
        ))}
      </div>

      <div className="create-footer">
        <button className="btn-add-more" onClick={addCard}>
          <span className="material-symbols-outlined">add</span> Thêm thẻ nữa
        </button>
        {/* NÚT LƯU THEO MÀU ACCENT, CÓ HIỆU ỨNG GLOW */}
        <button className="btn-save-deck" onClick={handleSaveDeck} disabled={isLoading}>
          <span className="material-symbols-outlined">save</span>
          {isLoading ? 'Đang lưu...' : 'Lưu & Hoàn tất'}
        </button>
      </div>
    </div>
  );
};

export default CreateDeck;