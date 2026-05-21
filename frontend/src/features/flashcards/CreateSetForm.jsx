import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createSet } from "../../services/flashcardSetApi";
import styles from "./CreateSetForm.module.css";

const CreateSetForm = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [serviceId, setServiceId] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    const cleanTitle = title.trim();
    const cleanDescription = description.trim();

    if (cleanTitle.length < 3) {
      setError("Tên bộ thẻ phải có ít nhất 3 ký tự.");
      return;
    }

    if (!serviceId) {
      setError("Vui lòng chọn danh mục.");
      return;
    }

    try {
      setLoading(true);

      const result = await createSet({
        title: cleanTitle,
        description: cleanDescription || null,
        service_id: Number(serviceId),
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
          "Tạo bộ thẻ thất bại. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2>📘 Tạo bộ thẻ mới</h2>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label>Tên bộ thẻ *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ví dụ: TOEIC Set"
            required
          />
        </div>

        <div className={styles.field}>
          <label>Mô tả</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="3"
            placeholder="Nhập mô tả cho bộ thẻ"
          />
        </div>

        <div className={styles.field}>
          <label>Danh mục</label>
          <select
            value={serviceId}
            onChange={(e) => setServiceId(Number(e.target.value))}
          >
            <option value={1}>Từ vựng cơ bản</option>
            <option value={2}>TOEIC</option>
            <option value={3}>IELTS</option>
            <option value={4}>Grammar</option>
            <option value={5}>Từ vựng nâng cao</option>
            <option value={6}>Tài liệu cá nhân</option>
          </select>
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
