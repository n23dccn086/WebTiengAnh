import { useState } from 'react';
import { autoFillWord, addFlashcardToSet } from '../../services/flashcardApi';
import styles from './AddFlashcardForm.module.css';

const AddFlashcardForm = ({ setId, onAdded }) => {
  const [word, setWord] = useState('');
  const [meaning, setMeaning] = useState('');
  const [pronunciation, setPronunciation] = useState('');
  const [example, setExample] = useState('');
  const [partOfSpeech, setPartOfSpeech] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoFillLoading, setAutoFillLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAutoFill = async () => {
    if (!word.trim()) {
      setError('Vui lòng nhập từ để tra');
      return;
    }
    setAutoFillLoading(true);
    setError('');
    try {
      const data = await autoFillWord(word);
      setMeaning(data.meaning || '');
      setPronunciation(data.pronunciation || '');
      setExample(data.example_sentence || '');
      setPartOfSpeech(data.part_of_speech || '');
    } catch (err) {
      setError(err.response?.data?.message || 'Không tìm thấy từ này');
    } finally {
      setAutoFillLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!word.trim() || !meaning.trim()) {
      setError('Vui lòng nhập từ và nghĩa');
      return;
    }
    setLoading(true);
    try {
      await addFlashcardToSet(setId, { word, meaning, pronunciation, example, part_of_speech });
      setWord('');
      setMeaning('');
      setPronunciation('');
      setExample('');
      setPartOfSpeech('');
      setError('');
      if (onAdded) onAdded();
    } catch (err) {
      setError(err.response?.data?.message || 'Thêm thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h3>➕ Thêm từ vựng mới</h3>
      <form onSubmit={handleSubmit}>
        <div className={styles.row}>
          <div className={styles.field}>
            <label>Từ *</label>
            <input type="text" value={word} onChange={e => setWord(e.target.value)} required />
          </div>
          <button type="button" onClick={handleAutoFill} disabled={autoFillLoading} className={styles.autoFillBtn}>
            {autoFillLoading ? '⏳' : '🔍 Tự động điền'}
          </button>
        </div>
        <div className={styles.field}>
          <label>Nghĩa *</label>
          <input type="text" value={meaning} onChange={e => setMeaning(e.target.value)} required />
        </div>
        <div className={styles.field}>
          <label>Phiên âm (IPA)</label>
          <input type="text" value={pronunciation} onChange={e => setPronunciation(e.target.value)} />
        </div>
        <div className={styles.field}>
          <label>Câu ví dụ</label>
          <textarea value={example} onChange={e => setExample(e.target.value)} rows="2" />
        </div>
        <div className={styles.field}>
          <label>Từ loại</label>
          <input type="text" value={partOfSpeech} onChange={e => setPartOfSpeech(e.target.value)} />
        </div>
        {error && <div className={styles.error}>{error}</div>}
        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? 'Đang thêm...' : 'Thêm từ vựng'}
        </button>
      </form>
    </div>
  );
};

export default AddFlashcardForm;