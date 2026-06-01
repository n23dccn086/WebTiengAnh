import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import { getUserSets, deleteSet, toggleSrs } from "../services/flashcardApi"; // ← sửa import
import UploadPdfModal from "../features/flashcards/UploadPdfModal";
import DocumentsButton from "../components/ui/DocumentsButton";
import LogoutButton from "../components/ui/LogoutButton";
import PlasticGooseButton from "../components/ui/PlasticGooseButton";
import MightyMooseButton from "../components/ui/MightyMooseButton";
import styles from "./Library.module.css";


const Library = () => {
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();

  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 18;

  useEffect(() => {
    loadSets();
  }, [currentPage]);

  const loadSets = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getUserSets(currentPage, limit);
      setSets(data.sets || []);
      setTotalPages(data.pagination?.total_pages || 1);
      setTotalItems(data.pagination?.total_items || 0);
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
    if (!window.confirm("Xóa bộ thẻ này?")) return;
    try {
      await deleteSet(id);
      await loadSets();
    } catch (error) {
      alert("Không thể xóa bộ thẻ.");
    }
  };

  const handleToggleSrs = async (id, currentStatus) => {
    try {
      await toggleSrs(id, !currentStatus);
      await loadSets();
    } catch (error) {
      alert("Không thể cập nhật SRS.");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  if (loading)
    return <div className={styles.loading}>📚 Đang tải thư viện...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>📚 Thư viện của tôi</h2>
        <DocumentsButton onClick={() => setShowUploadModal(true)} />
        <PlasticGooseButton onClick={() => navigate("/sets/create")}>
          + Tạo bộ thẻ
        </PlasticGooseButton>
        <LogoutButton onClick={handleLogout} />
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {sets.length === 0 ? (
        <div className={styles.emptyState}>
          <p>😢 Bạn chưa có bộ thẻ nào.</p>
          <Link to="/sets/create" className={styles.createBtnLarge}>
            + Tạo bộ thẻ đầu tiên
          </Link>
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            {sets.map((set) => (
              <div
                key={set.id}
                className={`${styles.card} ${user?.role === "PREMIUM" ? styles.premiumCard : ""}`}
              >
                <h3>{set.title}</h3>
                <p>{set.description || "Không có mô tả"}</p>
                <div className={styles.meta}>
                  <span>📖 {set.total_cards || 0} từ</span>
                </div>
                <div className={styles.actions}>
                  <MightyMooseButton
                    onClick={() => navigate(`/sets/${set.id}`)}
                  >
                    Xem chi tiết
                  </MightyMooseButton>
                  <button
                    onClick={() => handleToggleSrs(set.id, set.is_srs_enabled)}
                    className={styles.srsBtn}
                  >
                    {set.is_srs_enabled ? "🔁 Đang bật SRS" : "⏸️ Bật SRS"}
                  </button>
                  {!set.is_system && (
                    <button
                      onClick={() => handleDelete(set.id)}
                      className={styles.deleteBtn}
                    >
                      Xóa
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                disabled={currentPage === 1}
                onClick={() => goToPage(currentPage - 1)}
                className={styles.pageBtn}
              >
                ◀ Trước
              </button>
              <span className={styles.pageInfo}>
                Trang {currentPage} / {totalPages} (Tổng {totalItems} bộ)
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => goToPage(currentPage + 1)}
                className={styles.pageBtn}
              >
                Sau ▶
              </button>
            </div>
          )}
        </>
      )}
      <Link to="/dashboard" className={styles.backBtn}>
        ← Về Dashboard
      </Link>
      {showUploadModal && (
        <UploadPdfModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => loadSets()}
        />
      )}
    </div>
  );
};

export default Library;
