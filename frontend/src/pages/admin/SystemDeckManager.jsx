import { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import ImportExcelModal from '../../features/admin/ImportExcelModal'; // Import modal
import styles from './SystemDeckManager.module.css';

const SystemDeckManager = () => {
  const [title, setTitle] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [services, setServices] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [currentCard, setCurrentCard] = useState({
    word: '',
    meaning: '',
    pronunciation: '',
    example_sentence: '',
    part_of_speech: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [autoFillLoading, setAutoFillLoading] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false); // State cho modal import

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await apiClient.get('/services');
      setServices(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAutoFill = async () => {
    if (!currentCard.word.trim()) {
      alert('Vui lòng nhập từ để tra');
      return;
    }
    setAutoFillLoading(true);
    try {
      const res = await apiClient.post('/dictionary/auto-fill', { word: currentCard.word });
      const data = res.data.data;
      setCurrentCard(prev => ({
        ...prev,
        meaning: data.meaning || '',
        pronunciation: data.pronunciation || '',
        example_sentence: data.example_sentence || '',
        part_of_speech: data.part_of_speech || ''
      }));
    } catch (err) {
      alert(err.response?.data?.message || 'Không tìm thấy từ này');
    } finally {
      setAutoFillLoading(false);
    }
  };

  const addFlashcard = () => {
    if (!currentCard.word.trim() || !currentCard.meaning.trim()) {
      alert('Vui lòng nhập từ và nghĩa');
      return;
    }
    setFlashcards([...flashcards, { ...currentCard, id: Date.now() }]);
    setCurrentCard({
      word: '',
      meaning: '',
      pronunciation: '',
      example_sentence: '',
      part_of_speech: ''
    });
  };

  const removeFlashcard = (id) => {
    setFlashcards(flashcards.filter(card => card.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Vui lòng nhập tên bộ thẻ');
      return;
    }
    if (!serviceId) {
      alert('Vui lòng chọn danh mục');
      return;
    }
    if (flashcards.length === 0) {
      alert('Vui lòng thêm ít nhất 1 flashcard');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/admin/system-sets', {
        title: title.trim(),
        service_id: parseInt(serviceId),
        flashcards: flashcards.map(({ id, ...rest }) => rest)
      });
      setMessage('Tạo bộ thẻ hệ thống thành công!');
      setTitle('');
      setServiceId('');
      setFlashcards([]);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleImportSuccess = () => {
    setMessage('Import bộ thẻ thành công!');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>📚 Tạo bộ thẻ hệ thống</h2>
        <div>
          <button className={styles.importBtn} onClick={() => setShowImportModal(true)}>
            📂 Import từ Excel/CSV
          </button>
          <button className={styles.backBtn} onClick={() => window.location.href = '/admin'}>
            ← Quay lại Admin
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label>Tên bộ thẻ *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>

        <div className={styles.field}>
          <label>Danh mục *</label>
          <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} required>
            <option value="">-- Chọn danh mục --</option>
            {services.map(svc => (
              <option key={svc.id} value={svc.id}>{svc.title}</option>
            ))}
          </select>
        </div>

        <div className={styles.section}>
          <h3>➕ Thêm flashcard</h3>
          <div className={styles.row}>
            <div className={styles.field}>
              <label>Từ *</label>
              <input type="text" value={currentCard.word} onChange={(e) => setCurrentCard({ ...currentCard, word: e.target.value })} />
            </div>
            <button type="button" onClick={handleAutoFill} disabled={autoFillLoading} className={styles.autoFillBtn}>
              {autoFillLoading ? '⏳' : '🔍 Tự động điền'}
            </button>
          </div>
          <div className={styles.field}>
            <label>Nghĩa *</label>
            <input type="text" value={currentCard.meaning} onChange={(e) => setCurrentCard({ ...currentCard, meaning: e.target.value })} />
          </div>
          <div className={styles.field}>
            <label>Phiên âm (IPA)</label>
            <input type="text" value={currentCard.pronunciation} onChange={(e) => setCurrentCard({ ...currentCard, pronunciation: e.target.value })} />
          </div>
          <div className={styles.field}>
            <label>Câu ví dụ</label>
            <textarea rows="2" value={currentCard.example_sentence} onChange={(e) => setCurrentCard({ ...currentCard, example_sentence: e.target.value })} />
          </div>
          <div className={styles.field}>
            <label>Từ loại</label>
            <input type="text" value={currentCard.part_of_speech} onChange={(e) => setCurrentCard({ ...currentCard, part_of_speech: e.target.value })} />
          </div>
          <button type="button" onClick={addFlashcard} className={styles.addFlashcardBtn}>
            + Thêm flashcard
          </button>
        </div>

        {flashcards.length > 0 && (
          <div className={styles.section}>
            <h3>📖 Danh sách flashcard sẽ tạo ({flashcards.length})</h3>
            {flashcards.map(card => (
              <div key={card.id} className={styles.flashcardItem}>
                <div className={styles.flashcardInfo}>
                  <strong>{card.word}</strong> – {card.meaning}
                  {card.pronunciation && <span className={styles.pronounce}> /{card.pronunciation}/</span>}
                </div>
                <button type="button" onClick={() => removeFlashcard(card.id)} className={styles.removeBtn}>❌ Xóa</button>
              </div>
            ))}
          </div>
        )}

        {message && <div className={styles.success}>{message}</div>}

        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? 'Đang tạo...' : '✅ Tạo bộ thẻ hệ thống'}
        </button>
      </form>

      {showImportModal && (
        <ImportExcelModal
          onClose={() => setShowImportModal(false)}
          onSuccess={handleImportSuccess}
        />
      )}
    </div>
  );
};

export default SystemDeckManager;