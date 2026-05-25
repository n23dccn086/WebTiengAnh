import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import { getPersonalSets, deleteSet, toggleSrs } from "../services/flashcardSetApi";
import UploadPdfModal from "../features/flashcards/UploadPdfModal";
import DocumentsButton from "../components/ui/DocumentsButton";
import PerspectiveButton from "../components/ui/PerspectiveButton";
import LogoutButton from "../components/ui/LogoutButton";
import styles from "./Library.module.css";

const Library = () => {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    loadSets();
  }, []);

  const loadSets = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getPersonalSets();
      setSets(data);
    } catch (error) {
      console.error("Lỗi tải thư viện:", error);
      setSets([]);
      if (error.response?.status === 401 || error.response?.status === 403) {
        setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        await logout();
        setTimeout(() => navigate("/login"), 800);
        return;
      }
      setError("Không thể tải thư viện. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      if (!window.confirm("Xóa bộ thẻ này?")) return;
      await deleteSet(id);
      await loadSets();
    } catch (error) {
      console.error("Lỗi xóa bộ thẻ:", error);
      alert("Không thể xóa bộ thẻ. Vui lòng thử lại.");
    }
  };

  const handleToggleSrs = async (id, currentStatus) => {
    try {
      await toggleSrs(id, !currentStatus);
      await loadSets();
    } catch (error) {
      console.error("Lỗi bật/tắt SRS:", error);
      alert("Không thể cập nhật SRS. Vui lòng thử lại.");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (loading) {
    return <div className={styles.loading}>📚 Đang tải thư viện...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>📚 Thư viện của tôi</h2>
        <DocumentsButton onClick={() => setShowUploadModal(true)} />
        <PerspectiveButton onClick={() => navigate('/sets/create')}>+ Tạo bộ thẻ</PerspectiveButton>
        <LogoutButton onClick={handleLogout} />
      </div>

      {error && (
        <div style={{ background: "#fee2e2", color: "#991b1b", padding: "12px 16px", borderRadius: "10px", marginBottom: "16px", fontWeight: "700", border: "1px solid #ef4444" }}>
          {error}
        </div>
      )}

      {sets.length === 0 ? (
        <div className={styles.emptyState}>
          <p>😢 Bạn chưa có bộ thẻ nào.</p>
          <Link to="/sets/create" className={styles.createBtnLarge}>+ Tạo bộ thẻ đầu tiên</Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {sets.map((set) => (
            <div key={set.id} className={styles.card}>
              <h3>{set.title}</h3>
              <p>{set.description || "Không có mô tả"}</p>
              <div className={styles.meta}>
                <span>📖 {set.total_cards || 0} từ</span>
                <span>📂 {set.service_title || "Chưa phân loại"}</span>
              </div>
              <div className={styles.actions}>
                <Link to={`/sets/${set.id}`} className={styles.btn}>Xem chi tiết</Link>
                <button type="button" onClick={() => handleToggleSrs(set.id, set.is_srs_enabled)} className={styles.srsBtn}>
                  {set.is_srs_enabled ? "🔁 Đang bật SRS" : "⏸️ Bật SRS"}
                </button>
                <button type="button" onClick={() => handleDelete(set.id)} className={styles.deleteBtn}>Xóa</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Link to="/dashboard" className={styles.backBtn}>← Về Dashboard</Link>
      {showUploadModal && <UploadPdfModal onClose={() => setShowUploadModal(false)} onSuccess={() => loadSets()} />}
    </div>
  );
};

export default Library;