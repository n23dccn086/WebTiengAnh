import React from 'react';

const HeaderBar = ({ activeTab, setActiveTab, searchQuery, setSearchQuery }) => {
  return (
    <div className="library-header-bar">
      <div className="library-header-info">
        <h1>Thư viện của bạn</h1>
        <p>Làm chủ kho tàng kiến thức với thuật toán AI & SRS.</p>
      </div>

      <div className="library-header-actions">
        {/* Thanh tìm kiếm */}
        <div className="search-box">
          <span className="material-symbols-outlined search-icon">search</span>
          <input 
            type="text" 
            placeholder="Tìm kiếm bộ thẻ..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Nút Tạo mới nhanh (Tùy chọn hiển thị thêm) */}
        <button className="btn-new-set">
          <span className="material-symbols-outlined">add</span> New Set
        </button>
      </div>

      {/* Thanh Tabs chuyển đổi */}
      <div className="library-tabs">
        <button 
          className={`tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
          onClick={() => setActiveTab('personal')}
        >
          Cá nhân
        </button>
        <button 
          className={`tab-btn ${activeTab === 'system' ? 'active' : ''}`}
          onClick={() => setActiveTab('system')}
        >
          Hệ thống
        </button>
      </div>
    </div>
  );
};

export default HeaderBar;