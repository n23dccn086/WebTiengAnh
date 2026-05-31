import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getSetDetail, toggleSrs, deleteSet } from "../services/flashcardSetApi";
import { deleteFlashcard } from "../services/flashcardApi";
import AddFlashcardForm from "../features/flashcards/AddFlashcardForm";
import SRSConfig from "../features/srs/SRSConfig";
import TestHistory from "../components/TestHistory";
import styles from "./SetDetail.module.css";
import apiClient from '../services/apiClient';

const ITEMS_PER_PAGE = 10;

const SetDetail = () => {
  const { id } = useParams();
  const [set, setSet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadSet();
  }, [id, refresh]);

  const loadSet = async () => {
    const data = await getSetDetail(id);
    setSet(data);
    setLoading(false);
  };

  const handleToggleSrs = async (isEnabled) => {
    await toggleSrs(id, isEnabled);
    setRefresh(prev => !prev);
  };

  const handleDeleteSet = async () => {
    if (!window.confirm('Xóa toàn bộ bộ thẻ này? Hành động không thể hoàn tác.')) return;
    try {
      await deleteSet(id);
      window.location.href = '/library';
    } catch (err) {
      alert(err.response?.data?.message || 'Xóa thất bại');
    }
  };

  const handleDeleteFlashcard = async (flashcardId) => {
    if (!window.confirm('Xóa từ vựng này khỏi bộ thẻ?')) return;
    try {
      await deleteFlashcard(flashcardId);
      setRefresh(prev => !prev);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Xóa thất bại');
    }
  };

  const handleExport = async (format) => {
    try {
      const response = await apiClient.get(`/flashcard-sets/${id}/export?format=${format}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `flashcard_set_${id}.${format === 'xlsx' ? 'xlsx' : 'csv'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Xuất file thất bại');
    }
  };

  // Phân trang
  const flashcards = set?.flashcards || [];
  const totalPages = Math.ceil(flashcards.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCards = flashcards.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (loading) return <div className={styles.loading}>📖 Đang tải...</div>;

  const backLink = set?.is_system 
    ? `/sets/service/${set.service_id}`
    : '/library';

  return (
    <div className={styles.container}>
      <Link to={backLink} className={styles.backBtn}>← {set?.is_system ? 'Về danh mục' : 'Thư viện'}</Link>
      <div className={styles.header}>
        <h2>{set.title}</h2>
        <p>{set.description}</p>
        <div className={styles.meta}>📦 {set.total_cards} từ vựng</div>
        {!set.is_system && (
          <button onClick={handleDeleteSet} className={styles.deleteSetBtn}>🗑️ Xóa bộ thẻ</button>
        )}
      </div>
      <div className={styles.actions}>
        <Link to={`/sets/${id}/flashcard-basic`} className={styles.btn}>📇 Học lật thẻ</Link>
        <Link to={`/sets/${id}/practice`} className={styles.btn}>✍️ Practice (ABCD)</Link>
        <Link to={`/sets/${id}/test`} className={styles.btn}>📝 Test (có lưu)</Link>
        <Link to={`/game/${id}`} className={`${styles.btn} ${styles.gameBtn}`}>🎮 Ghép thẻ</Link>
        <div className={styles.exportButtons}>
          <button onClick={() => handleExport('csv')} className={styles.exportBtn}>📥 CSV</button>
          <button onClick={() => handleExport('xlsx')} className={styles.exportBtn}>📥 Excel</button>
        </div>
      </div>
      
      {set.is_srs_enabled !== undefined && (
        <div className={styles.srsSection}>
          <SRSConfig isEnabled={set.is_srs_enabled} onToggle={handleToggleSrs} />
        </div>
      )}

      <div className={styles.flashcardList}>
        <h3>Danh sách từ vựng</h3>
        {paginatedCards.map(fc => (
          <div key={fc.id} className={styles.fcItem}>
            <div className={styles.fcInfo}>
              <span className={styles.fcWord}>{fc.word}</span>
              <span className={styles.fcMeaning}> – {fc.meaning}</span>
              {fc.pronunciation && <span className={styles.fcPronounce}> /{fc.pronunciation}/</span>}
            </div>
            {!set.is_system && (
              <button onClick={() => handleDeleteFlashcard(fc.id)} className={styles.deleteCardBtn} title="Xóa từ">
                🗑️
              </button>
            )}
          </div>
        ))}
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className={styles.pageBtn}>◀</button>
            <span>Trang {currentPage} / {totalPages}</span>
            <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className={styles.pageBtn}>▶</button>
          </div>
        )}
      </div>

      {!set.is_system && <AddFlashcardForm setId={id} onAdded={() => setRefresh(prev => !prev)} />}
      
      <TestHistory setId={id} />
    </div>
  );
};

export default SetDetail;