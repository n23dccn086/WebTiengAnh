import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import styles from './EditSystemSet.module.css';

const EditSystemSet = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [set, setSet] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCard, setNewCard] = useState({ word: '', meaning: '', pronunciation: '', example_sentence: '', part_of_speech: '' });
  const [autoFillLoading, setAutoFillLoading] = useState(false);

  useEffect(() => {
    fetchSet();
  }, []);

  const fetchSet = async () => {
    try {
      const res = await apiClient.get(`/flashcard-sets/${id}`);
      setSet(res.data.data);
      setFlashcards(res.data.data.flashcards || []);
    } catch (err) {
      console.error(err);
      alert('Không thể tải bộ thẻ');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFill = async () => {
    if (!newCard.word.trim()) return alert('Nhập từ');
    setAutoFillLoading(true);
    try {
      const res = await apiClient.post('/dictionary/auto-fill', { word: newCard.word });
      const data = res.data.data;
      setNewCard(prev => ({ ...prev, meaning: data.meaning || '', pronunciation: data.pronunciation || '', example_sentence: data.example_sentence || '', part_of_speech: data.part_of_speech || '' }));
    } catch (err) {
      alert('Không tìm thấy từ');
    } finally {
      setAutoFillLoading(false);
    }
  };

  const addFlashcard = async () => {
    if (!newCard.word || !newCard.meaning) return alert('Nhập từ và nghĩa');
    try {
      await apiClient.post(`/flashcards`, { set_id: id, ...newCard });
      fetchSet();
      setNewCard({ word: '', meaning: '', pronunciation: '', example_sentence: '', part_of_speech: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Thêm thất bại');
    }
  };

  const deleteFlashcard = async (flashcardId) => {
    if (!window.confirm('Xóa từ này?')) return;
    try {
      await apiClient.delete(`/flashcards/${flashcardId}`);
      fetchSet();
    } catch (err) {
      alert('Xóa thất bại');
    }
  };

  const updateSet = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const title = formData.get('title');
    const description = formData.get('description');
    try {
      await apiClient.put(`/admin/system-sets/${id}`, { title, description });
      alert('Cập nhật thành công');
      fetchSet();
    } catch (err) {
      alert(err.response?.data?.message);
    }
  };

  if (loading) return <div>Đang tải...</div>;

  return (
    <div className={styles.container}>
      <Link to="/admin/system-sets" className={styles.backBtn}>← Quay lại danh sách</Link>
      <h2>✏️ Sửa bộ thẻ: {set?.title}</h2>
      <form onSubmit={updateSet} className={styles.form}>
        <input name="title" defaultValue={set?.title} placeholder="Tiêu đề" required />
        <textarea name="description" defaultValue={set?.description} placeholder="Mô tả" />
        <button type="submit">Cập nhật thông tin</button>
      </form>

      <h3>Danh sách từ vựng</h3>
      <div className={styles.flashcardList}>
        {flashcards.map(card => (
          <div key={card.id} className={styles.cardItem}>
            <span><strong>{card.word}</strong> – {card.meaning}</span>
            <button onClick={() => deleteFlashcard(card.id)} className={styles.deleteCardBtn}>🗑️</button>
          </div>
        ))}
      </div>

      <h3>Thêm từ vựng mới</h3>
      <div className={styles.addCard}>
        <input type="text" placeholder="Từ" value={newCard.word} onChange={e => setNewCard({ ...newCard, word: e.target.value })} />
        <button onClick={handleAutoFill} disabled={autoFillLoading}>🔍 Tự động điền</button>
        <input type="text" placeholder="Nghĩa" value={newCard.meaning} onChange={e => setNewCard({ ...newCard, meaning: e.target.value })} />
        <input type="text" placeholder="Phiên âm" value={newCard.pronunciation} onChange={e => setNewCard({ ...newCard, pronunciation: e.target.value })} />
        <textarea placeholder="Câu ví dụ" value={newCard.example_sentence} onChange={e => setNewCard({ ...newCard, example_sentence: e.target.value })} />
        <input type="text" placeholder="Từ loại" value={newCard.part_of_speech} onChange={e => setNewCard({ ...newCard, part_of_speech: e.target.value })} />
        <button onClick={addFlashcard}>+ Thêm flashcard</button>
      </div>
    </div>
  );
};

export default EditSystemSet;