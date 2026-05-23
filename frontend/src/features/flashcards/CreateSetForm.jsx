import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createSet } from "../../services/flashcardSetApi";
import styles from "./CreateSetForm.module.css";

const CreateSetForm = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const DEFAULT_SERVICE_ID = 6;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cleanTitle = title.trim();
    const cleanDescription = description.trim();

    if (cleanTitle.length < 3) {
      setError("Tên bộ thẻ phải có ít nhất 3 ký tự.");
      return;
    }

    try {
      setLoading(true);
      const result = await createSet({
        title: cleanTitle,
        description: cleanDescription || null,
        service_id: DEFAULT_SERVICE_ID,
      });

      const newSetId = result?.data?.id || result?.id;
      if (newSetId) {
        navigate(`/sets/${newSetId}`);
        return;
      }
      setError("Tạo bộ thẻ thất bại. Không nhận được ID bộ thẻ.");
    } catch (err) {
      console.error("Lỗi tạo bộ thẻ:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Tạo bộ thẻ thất bại. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Link to="/library" className={styles.backLink}>← Thư viện</Link>
      <h2>📘 Tạo bộ thẻ mới</h2>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label>Tên bộ thẻ *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ví dụ: Từ vựng của tôi"
            required
          />
        </div>

        <div className={styles.field}>
          <label>Mô tả</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="3"
            placeholder="Nhập mô tả cho bộ thẻ (không bắt buộc)"
          />
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? "Đang tạo..." : "Tạo bộ thẻ"}
        </button>
      </form>
    </div>
  );
};

export default CreateSetForm;