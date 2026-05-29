import React, { useState, useEffect } from 'react';
import apiClient from '../../../services/apiClient';
// Dùng lại CSS bảng từ trang Users cho đồng bộ
import '../Users/AdminUsers.css'; 
import './AdminTransactions.css';

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  
  // Bộ lọc trạng thái
  const [statusFilter, setStatusFilter] = useState('SUCCESS'); // Mặc định xem cái thành công
  
  const fetchTransactions = async (pageToFetch = 1) => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/transactions', {
        params: {
          page: pageToFetch,
          limit: 10,
          status: statusFilter === 'ALL' ? '' : statusFilter
        }
      });
      
      const { transactions, total_revenue, pagination } = res.data.data;
      setTransactions(transactions || []);
      setTotalRevenue(total_revenue || 0);
      
      // Dự phòng trường hợp BE trả về thiếu totalPages
      setPagination({
        ...pagination,
        totalPages: pagination.totalPages || Math.ceil((pagination.total || 0) / pagination.limit) || 1
      });
    } catch (error) {
      console.error("Lỗi lấy giao dịch:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(1);
  }, [statusFilter]);

  // Các hàm Format dữ liệu cho đẹp
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="admin-transactions-container">
      
      {/* THẺ TỔNG DOANH THU */}
      <div className="revenue-card">
        <div className="revenue-info">
          <h3>Tổng Doanh Thu (Giao dịch thành công)</h3>
          <p className="revenue-amount">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="revenue-icon">
          <span className="material-symbols-outlined">account_balance_wallet</span>
        </div>
      </div>

      {/* THANH CÔNG CỤ (TOOLBAR) */}
      <div className="users-toolbar">
        <h2 style={{ fontSize: '20px', margin: 0, color: 'var(--text-main)' }}>Lịch Sử Giao Dịch</h2>
        
        <div className="toolbar-filters">
          <select 
            className="filter-select" 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="SUCCESS">Thành công (SUCCESS)</option>
            <option value="PENDING">Đang chờ (PENDING)</option>
            <option value="FAILED">Thất bại (FAILED)</option>
            <option value="CANCELLED">Đã hủy (CANCELLED)</option>
          </select>
        </div>
      </div>

      {/* BẢNG DỮ LIỆU */}
      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Mã GD (Ref)</th>
              <th>Người Dùng (Email)</th>
              <th>Cổng TT</th>
              <th style={{textAlign: 'right'}}>Số Tiền</th>
              <th style={{textAlign: 'center'}}>Trạng Thái</th>
              <th style={{textAlign: 'right'}}>Thời Gian</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{textAlign: 'center', padding: '32px'}}>Đang tải dữ liệu...</td></tr>
            ) : transactions.length === 0 ? (
              <tr><td colSpan="6" style={{textAlign: 'center', padding: '32px', color: 'var(--text-muted)'}}>Không tìm thấy giao dịch nào.</td></tr>
            ) : (
              transactions.map(tx => (
                <tr key={tx.id}>
                  <td><span className="tx-ref">{tx.transaction_ref || `#${tx.id}`}</span></td>
                  <td style={{ color: 'var(--text-main)' }}>{tx.email}</td>
                  
                  <td>
                    <span className={`provider-badge provider-${tx.provider?.toLowerCase()}`}>
                      {tx.provider || 'UNKNOWN'}
                    </span>
                  </td>
                  
                  <td style={{textAlign: 'right', fontWeight: '700', color: tx.status === 'SUCCESS' ? 'var(--success)' : 'var(--text-main)'}}>
                    {tx.status === 'SUCCESS' ? '+' : ''}{formatCurrency(tx.amount)}
                  </td>
                  
                  <td style={{textAlign: 'center'}}>
                    <span className={`badge status-${tx.status?.toLowerCase()}`}>
                      {tx.status}
                    </span>
                  </td>
                  
                  <td style={{textAlign: 'right', color: 'var(--text-muted)', fontSize: '13px'}}>
                    {formatDate(tx.created_at)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* PHÂN TRANG */}
        {!loading && transactions.length > 0 && (
          <div className="pagination-controls">
            <div className="pagination-info">
              Trang {pagination.page} / {pagination.totalPages || 1}
            </div>
            <div className="pagination-buttons">
              <button 
                className="btn-page" 
                disabled={pagination.page <= 1}
                onClick={() => fetchTransactions(pagination.page - 1)}
              >
                Trước
              </button>
              <button 
                className="btn-page" 
                disabled={pagination.page >= (pagination.totalPages || 1)}
                onClick={() => fetchTransactions(pagination.page + 1)}
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminTransactions;