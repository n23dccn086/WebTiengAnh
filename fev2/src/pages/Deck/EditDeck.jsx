import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import useAuthStore from '../../store/authStore';

// Dùng lại các Component của CreateDeck
import FlashcardItem from './components/FlashcardItem';
import LeaveModal from './components/LeaveModal';
import './CreateDeck.css';

const EditDeck = () => {
  const { id } = useParams(); // Lấy ID bộ thẻ từ URL
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { user, loginSuccess } = useAuthStore();

  const [deckData, setDeckData] = useState({ title: '', description: '', service_id: 1 });
  const [cards, setCards] = useState([]);
  const [deletedCardIds, setDeletedCardIds] = useState([]); // Mảng theo dõi các thẻ bị người dùng xóa

  const [isAutoFetch, setIsAutoFetch] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true); // Trạng thái đang tải dữ liệu cũ
  const [isExtracting, setIsExtracting] = useState(false);
  const [toast, setToast] = useState({ type: '', message: '', visible: false });
  const [isDirty, setIsDirty] = useState(false);
  const [leaveModal, setLeaveModal] = useState({ visible: false, targetPath: '' });

  const markDirty = () => setIsDirty(true);

  const showToast = useCallback((type, message) => {
    setToast({ type, message, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 4000);
  }, []);

  // ==========================================
  // 1. GỌI API LẤY DỮ LIỆU CŨ KHI MỞ TRANG
  // ==========================================
  useEffect(() => {
    const fetchDeckData = async () => {
      try {
        const res = await apiClient.get(`/flashcard-sets/${id}`);
        const data = res.data.data;

        setDeckData({ title: data.title, description: data.description || '', service_id: data.service_id || 1 });

        if (data.flashcards && data.flashcards.length > 0) {
          const formattedCards = data.flashcards.map(c => ({
            ...c, suggestionData: null, isDeleting: false
          }));
          setCards(formattedCards);
        } else {
          setCards([{ word: '', meaning: '', pronunciation: '', example_sentence: '', suggestionData: null, isDeleting: false }]);
        }
      } catch (err) {
        showToast('error', 'Không thể tải dữ liệu bộ thẻ này.');
        setTimeout(() => navigate('/library'), 1500);
      } finally {
        setIsFetching(false);
      }
    };
    fetchDeckData();
  }, [id, navigate, showToast]);

  // ==========================================
  // 2. CHẶN CHUYỂN TRANG NẾU CHƯA LƯU
  // ==========================================
  useEffect(() => {
    const handleBeforeUnload = (e) => { if (!isDirty) return; e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handleBeforeUnload);

    const handleGlobalClick = (e) => {
      if (!isDirty) return;
      const targetLink = e.target.closest('a');
      if (targetLink) {
        const href = targetLink.getAttribute('href');
        if (href && href.startsWith('/') && href !== window.location.pathname) {
          e.preventDefault(); e.stopPropagation();
          setLeaveModal({ visible: true, targetPath: href });
        }
      }
    };
    document.addEventListener('click', handleGlobalClick, true);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('click', handleGlobalClick, true);
    };
  }, [isDirty]);

  // ==========================================
  // 3. XỬ LÝ STATE THẺ
  // ==========================================
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
    const cardToRemove = newCards[index];

    // Nếu thẻ này đã có ID (Tức là thẻ cũ từ DB), ta phải lưu ID lại để lát nữa gọi API xóa
    if (cardToRemove.id) {
      setDeletedCardIds(prev => [...prev, cardToRemove.id]);
    }

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
    setIsExtracting(true); showToast('info', 'AI đang đọc tài liệu của bạn...');
    const formData = new FormData(); formData.append('file', file); formData.append('title', deckData.title || 'PDF Imported'); formData.append('service_id', deckData.service_id);
    try {
      const res = await apiClient.post('/flashcard-sets/pdf-extract', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      loginSuccess({ ...user, ai_quota: user.ai_quota - 1 }, localStorage.getItem('accessToken'), localStorage.getItem('refreshToken'));

      const formattedCards = res.data.data.flashcards.map(c => ({ ...c, suggestionData: null, isDeleting: false }));
      setCards(prev => {
        const existing = prev.filter(c => c.word.trim() || c.meaning.trim());
        return existing.length > 0 ? [...existing, ...formattedCards] : formattedCards;
      });
      markDirty(); showToast('success', `Đã trích xuất thêm ${formattedCards.length} từ vào bộ thẻ!`);
    } catch (err) {
      showToast('error', 'Có lỗi xảy ra khi xử lý file PDF.');
    } finally { setIsExtracting(false); e.target.value = null; }
  };

  // ==========================================
  // 4. LƯU TOÀN BỘ CẬP NHẬT
  // ==========================================
  const handleSaveDeck = async () => {
    if (!deckData.title) { showToast('error', 'Vui lòng nhập Tên bộ thẻ.'); return; }
    const validCards = cards.filter(c => c.word.trim() && c.meaning.trim() && !c.isDeleting);
    if (validCards.length === 0) { showToast('error', 'Vui lòng điền hoàn chỉnh Từ vựng và Ý nghĩa.'); return; }

    setIsLoading(true); showToast('info', 'Đang lưu các thay đổi...');

    try {
      // 4.1 Cập nhật thông tin Bộ thẻ
      await apiClient.put(`/flashcard-sets/${id}`, { title: deckData.title, description: deckData.description });

      // 4.2 Xóa các thẻ cũ mà người dùng đã bấm thùng rác
      if (deletedCardIds.length > 0) {
        const deletePromises = deletedCardIds.map(cardId => apiClient.delete(`/flashcards/${cardId}`));
        await Promise.all(deletePromises);
      }

      // 4.3 Thêm mới hoặc Cập nhật các thẻ còn lại
      const saveCardPromises = validCards.map(card => {
        if (card.id) {
          // Thẻ cũ -> Gọi API Cập nhật
          return apiClient.put(`/flashcards/${card.id}`, {
            word: card.word, meaning: card.meaning, pronunciation: card.pronunciation, example_sentence: card.example_sentence
          });
        } else {
          // Thẻ mới sinh ra -> Gọi API Thêm
          
          return apiClient.post('/flashcards', {
            set_id: parseInt(id, 10),
            word: card.word,
            meaning: card.meaning,
            pronunciation: card.pronunciation,
            example_sentence: card.example_sentence
          });
        }
      });
      await Promise.all(saveCardPromises);

      setIsDirty(false);
      showToast('success', 'Cập nhật bộ thẻ thành công!');
      setTimeout(() => navigate('/library'), 1500);
    } catch (err) {
      showToast('error', 'Có lỗi xảy ra khi lưu bộ thẻ.');
      setIsLoading(false);
    }
  };

  const confirmLeave = () => { setIsDirty(false); setLeaveModal({ visible: false, targetPath: '' }); navigate(leaveModal.targetPath); };
  const confirmSaveAndLeave = () => { setLeaveModal(prev => ({ ...prev, visible: false })); handleSaveDeck(); };

  if (isFetching) {
    return <div className="global-loader-overlay"><div className="circular-spinner"></div></div>;
  }

  return (
    <div className="create-deck-container">
      {toast.visible && <div className={`toast-notification ${toast.type}`}><p>{toast.message}</p></div>}
      {isExtracting && <div className="global-loader-overlay"><div className="circular-spinner"></div><p>AI đang bóc tách tài liệu...</p></div>}

      {leaveModal.visible && (
        <LeaveModal onSaveAndLeave={confirmSaveAndLeave} onDiscard={confirmLeave} onCancel={() => setLeaveModal({ visible: false, targetPath: '' })} />
      )}

      <header className="page-header">
        <h1>Chỉnh sửa bộ thẻ</h1>
        <p>Cập nhật nội dung bài học của bạn.</p>
      </header>

      <div className="command-center-wrapper">
        <div className="command-center glass-panel">
          <input type="file" accept="application/pdf" ref={fileInputRef} onChange={handlePdfUpload} style={{ display: 'none' }} />
          <button className="btn-pdf-magic" onClick={() => fileInputRef.current.click()} disabled={isExtracting}>
            <span className="material-symbols-outlined">auto_awesome</span>
            {isExtracting ? 'Đang phân tích PDF...' : 'Trích xuất thêm PDF'}
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
            key={index} card={card} index={index} totalCards={cards.length}
            isAutoFetch={isAutoFetch} onChange={handleCardChange} onBlur={handleWordBlur}
            onRemove={removeCard} onApplySuggestion={applySuggestion}
          />
        ))}
      </div>

      <div className="create-footer">
        <button className="btn-add-more" onClick={addCard}>
          <span className="material-symbols-outlined">add</span> Thêm thẻ mới
        </button>
        <button className="btn-save-deck" onClick={handleSaveDeck} disabled={isLoading}>
          <span className="material-symbols-outlined">save</span>
          {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>
    </div>
  );
};

export default EditDeck;