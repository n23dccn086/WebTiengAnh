import React from 'react';
import './AdminDashboard.css';

const AdminDashboard = () => {
  // Mock data tạm thời để giao diện lên hình đẹp mắt
  // Sau này bạn có thể gọi API GET /api/v1/admin/stats để lấy số thật
  const stats = {
    totalUsers: 1250,
    premiumUsers: 85,
    monthlyRevenue: "4,500,000",
    systemSets: 12
  };

  return (
    <div className="admin-dashboard">
      
      {/* KHỐI 1: CÁC THẺ THỐNG KÊ (QUICK STATS) */}
      <div className="stats-grid">
        
        <div className="stat-card">
          <div className="stat-icon icon-users">
            <span className="material-symbols-outlined">group</span>
          </div>
          <div className="stat-info">
            <span className="stat-title">Tổng Người Dùng</span>
            <span className="stat-value">{stats.totalUsers}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-premium">
            <span className="material-symbols-outlined">workspace_premium</span>
          </div>
          <div className="stat-info">
            <span className="stat-title">Tài Khoản Premium</span>
            <span className="stat-value">{stats.premiumUsers}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-revenue">
            <span className="material-symbols-outlined">payments</span>
          </div>
          <div className="stat-info">
            <span className="stat-title">Doanh Thu Tháng (VNĐ)</span>
            <span className="stat-value">{stats.monthlyRevenue}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon icon-system">
            <span className="material-symbols-outlined">library_books</span>
          </div>
          <div className="stat-info">
            <span className="stat-title">Bộ Thẻ Hệ Thống</span>
            <span className="stat-value">{stats.systemSets}</span>
          </div>
        </div>

      </div>

      {/* KHỐI 2: KHU VỰC THÔNG TIN MỞ RỘNG */}
      <div className="dashboard-bottom-grid">
        
        {/* Box bên trái: Hoạt động gần đây */}
        <div className="dashboard-panel">
          <h3 className="panel-header">
            <span className="material-symbols-outlined">monitoring</span>
            Biểu Đồ Tăng Trưởng
          </h3>
          <div className="empty-panel">
            <span className="material-symbols-outlined">show_chart</span>
            <p>Dữ liệu biểu đồ đang được cập nhật...</p>
          </div>
        </div>

        {/* Box bên phải: Cảnh báo / Logs hệ thống */}
        <div className="dashboard-panel">
          <h3 className="panel-header">
            <span className="material-symbols-outlined">history</span>
            Hoạt Động Gần Đây
          </h3>
          <div className="empty-panel">
            <span className="material-symbols-outlined">notifications_off</span>
            <p>Chưa có thông báo mới nào.</p>
          </div>
        </div>

      </div>

    </div>
  );
};

export default AdminDashboard;