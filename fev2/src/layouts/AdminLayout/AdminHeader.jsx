import React, { useState, useRef, useEffect } from 'react';
import apiClient from '../../services/apiClient';
import useAuthStore from '../../store/authStore';
import '../MainLayout/Header/Header.css'; // Vẫn dùng chung CSS để tiết kiệm code

const AdminHeader = ({ isCollapsed }) => {
  const logoutSuccess = useAuthStore((state) => state.logoutSuccess);
  const user = useAuthStore((state) => state.user);
  
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsProfileOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) await apiClient.post('/auth/logout', { refresh_token: refreshToken });
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
    } finally {
      logoutSuccess();
      window.location.href = '/'; 
    }
  };

  const getInitial = () => user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'A';

  return (
    <header className={`main-header ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="header-left">
         <div className="search-container">
           <span className="material-symbols-outlined search-icon">search</span>
           <input type="text" className="search-input" placeholder="Tìm kiếm trong hệ thống..." />
         </div>
      </div>
      
      <div className="header-right">
        {/* Nút ADMIN màu tím accent */}
        <button className="pro-badge-header" style={{ border: 'none', backgroundColor: 'var(--accent)', color: 'white' }} title="Quản trị viên hệ thống">
          ADMIN
        </button>
        
        <div className="profile-container" ref={dropdownRef}>
          <div className="avatar" onClick={() => setIsProfileOpen(!isProfileOpen)}>
            {getInitial()}
          </div>

          {isProfileOpen && (
            <div className="profile-dropdown" style={{width: '200px'}}>
              <div className="dropdown-header">
                <p className="user-name">{user?.full_name || 'Admin'}</p>
                <p className="user-email">{user?.email || 'admin@neurallearn.com'}</p>
              </div>
              <ul className="dropdown-menu">
                <li onClick={handleLogout} className="logout-item">
                  <span className="material-symbols-outlined">logout</span> Đăng xuất
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;