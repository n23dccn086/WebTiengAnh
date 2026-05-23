import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getSetDetail } from "../services/flashcardSetApi";
import AddFlashcardForm from "../features/flashcards/AddFlashcardForm";
import styles from "./SetDetail.module.css";

const SetDetail = () => {
  const { id } = useParams();
  const [set, setSet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);

  useEffect(() => {
    loadSet();
  }, [id, refresh]);

  const loadSet = async () => {
    const data = await getSetDetail(id);
    setSet(data);
    setLoading(false);
  };

  if (loading) return <div className={styles.loading}>📖 Đang tải...</div>;

  return (
    <div className={styles.container}>
      <Link to="/library" className={styles.backBtn}>← Thư viện</Link>
      <div className={styles.header}>
        <h2>{set.title}</h2>
        <p>{set.description}</p>
        <div className={styles.meta}>📦 {set.total_cards} từ vựng</div>
      </div>
      <div className={styles.actions}>
        <Link to={`/sets/${id}/flashcard-basic`} className={styles.btn}>📇 Học lật thẻ</Link>
        <Link to={`/sets/${id}/practice`} className={styles.btn}>✍️ Practice (ABCD)</Link>
        <Link to={`/sets/${id}/test`} className={styles.btn}>📝 Test (có lưu)</Link>
      </div>
      <div className={styles.flashcardList}>
        <h3>Danh sách từ vựng</h3>
        {set.flashcards && set.flashcards.map(fc => (
          <div key={fc.id} className={styles.fcItem}>
            <span className={styles.fcWord}>{fc.word}</span>
            <span className={styles.fcMeaning}>{fc.meaning}</span>
          </div>
        ))}
      </div>
      <AddFlashcardForm setId={id} onAdded={() => setRefresh(prev => !prev)} />
    </div>
  );
};

export default SetDetail;