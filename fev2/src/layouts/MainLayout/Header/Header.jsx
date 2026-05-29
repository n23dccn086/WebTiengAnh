import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../../services/apiClient';
import useAuthStore from '../../../store/authStore';
import './Header.css';

const Header = ({ isCollapsed, onOpenPremium }) => {
  const navigate = useNavigate();
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

  const getInitial = () => user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U';

  return (
    <header className={`main-header ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="header-left">
         {/* ĐÃ XÓA NÚT HAMBURGER Ở ĐÂY */}
         <div className="search-container">
           <span className="material-symbols-outlined search-icon">search</span>
           <input type="text" className="search-input" placeholder="Flashcard sets, textbooks..." />
         </div>
      </div>
      
      <div className="header-right">
        <button className="header-btn-create" onClick={() => navigate('/create-deck')} title="Create Deck">
          <span className="material-symbols-outlined" style={{fontSize: '20px'}}>add</span>
        </button>

        {['ADMIN', 'SUPER_ADMIN'].includes(user?.role) || [4, 5].includes(user?.role_id) ? (
          <button className="pro-badge-header" style={{ border: 'none', backgroundColor: 'var(--error)' }} title="Quản trị viên hệ thống">
            ADMIN
          </button>
        ) : user?.role !== 'PREMIUM' ? (
          <button className="header-btn-upgrade" onClick={onOpenPremium}>
            Upgrade
          </button>
        ) : (
          <button className="pro-badge-header" onClick={() => navigate('/profile')} style={{ border: 'none', cursor: 'pointer' }} title="Quản lý tài khoản PRO">
            PRO
          </button>
        )}

        <button className="icon-btn">
          <span className="material-symbols-outlined">notifications</span>
          <span className="notification-dot"></span>
        </button>
        
        <div className="profile-container" ref={dropdownRef}>
          <div className="avatar" onClick={() => setIsProfileOpen(!isProfileOpen)}>
            {getInitial()}
          </div>

          {isProfileOpen && (
            <div className="profile-dropdown">
              <div className="dropdown-header">
                <p className="user-name">{user?.full_name || 'Người dùng'}</p>
                <p className="user-email">{user?.email || 'Chưa cập nhật email'}</p>
              </div>
              <ul className="dropdown-menu">
                <li onClick={() => { setIsProfileOpen(false); navigate('/profile'); }}>
                  <span className="material-symbols-outlined">person</span> Hồ sơ cá nhân
                </li>
                <li onClick={() => { setIsProfileOpen(false); navigate('/change-password'); }}>
                  <span className="material-symbols-outlined">key</span> Đổi mật khẩu
                </li>
                <div className="dropdown-divider"></div>
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

export default Header;