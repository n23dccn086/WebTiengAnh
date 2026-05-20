import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useAuthStore from "../store/authStore";
import { getUserSets, deleteSet, toggleSrs } from "../services/flashcardSetApi";
import styles from "./Library.module.css";

const Library = () => {
  const { logout } = useAuthStore();
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSets();
  }, []);

  const loadSets = async () => {
    const data = await getUserSets();
    setSets(data);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Xóa bộ thẻ này?")) {
      await deleteSet(id);
      loadSets();
    }
  };

  const handleToggleSrs = async (id, currentStatus) => {
    await toggleSrs(id, !currentStatus);
    loadSets();
  };

  if (loading) return <div className={styles.loading}>📚 Đang tải thư viện...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>📚 Thư viện của tôi</h2>
        <Link to="/sets/create" className={styles.createBtn}>+ Tạo bộ thẻ mới</Link>
        <button onClick={logout} className={styles.logoutBtn}>Đăng xuất</button>
      </div>

      {sets.length === 0 ? (
        <div className={styles.emptyState}>
          <p>😢 Bạn chưa có bộ thẻ nào.</p>
          <Link to="/sets/create" className={styles.createBtnLarge}>+ Tạo bộ thẻ đầu tiên</Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {sets.map(set => (
            <div key={set.id} className={styles.card}>
              <h3>{set.title}</h3>
              <p>{set.description || "Không có mô tả"}</p>
              <div className={styles.meta}>
                <span>📖 {set.total_flashcards} từ</span>
                <span>📂 {set.service_title}</span>
              </div>
              <div className={styles.actions}>
                <Link to={`/sets/${set.id}`} className={styles.btn}>Xem chi tiết</Link>
                <button onClick={() => handleToggleSrs(set.id, set.is_srs_enabled)} className={styles.srsBtn}>
                  {set.is_srs_enabled ? "🔁 Đang bật SRS" : "⏸️ Bật SRS"}
                </button>
                <button onClick={() => handleDelete(set.id)} className={styles.deleteBtn}>Xóa</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Link to="/dashboard" className={styles.backBtn}>← Về Dashboard</Link>
    </div>
  );
};

export default Library;