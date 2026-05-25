import { useEffect, useState } from 'react';
import apiClient from '../../services/apiClient';
import styles from './TransactionManager.module.css';

const TransactionManager = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, [statusFilter]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      const res = await apiClient.get(`/admin/transactions?${params.toString()}`);
      setTransactions(res.data.data.transactions);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải giao dịch');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className={styles.loading}>Đang tải...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>💰 Lịch sử giao dịch</h2>
        <button className={styles.backBtn} onClick={() => window.location.href = '/admin'}>← Quay lại Admin</button>
      </div>

      <div className={styles.filters}>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={styles.filterSelect}>
          <option value="">Tất cả trạng thái</option>
          <option value="SUCCESS">Thành công</option>
          <option value="PENDING">Đang xử lý</option>
          <option value="FAILED">Thất bại</option>
          <option value="CANCELED">Đã hủy</option>
        </select>
        <button onClick={fetchTransactions} className={styles.refreshBtn}>🔄 Làm mới</button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.table}>
        <table>
          <thead>
            <tr><th>ID</th><th>Mã tham chiếu</th><th>Người dùng</th><th>Số tiền</th><th>Provider</th><th>Trạng thái</th><th>Ngày tạo</th></tr>
          </thead>
          <tbody>
            {transactions.map(t => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>{t.transaction_ref}</td>
                <td>{t.email}</td>
                <td>{t.amount?.toLocaleString()}đ</td>
                <td>{t.provider}</td>
                <td className={t.status === 'SUCCESS' ? styles.statusSuccess : t.status === 'PENDING' ? styles.statusPending : styles.statusFailed}>
                  {t.status}
                </td>
                <td>{new Date(t.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionManager;