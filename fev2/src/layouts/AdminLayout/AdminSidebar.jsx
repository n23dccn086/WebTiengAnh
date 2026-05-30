import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import '../MainLayout/Sidebar/Sidebar.css'; 

const AdminSidebar = ({ isCollapsed, toggleSidebar }) => {
  const { user } = useAuthStore();
  
  // Xác định Super Admin
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role_id === 5;

  return (
    <nav className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div>
        <div className="sidebar-header-wrapper">
          {/* Sửa link trỏ thẳng về quản lý users thay vì dashboard */}
          <Link to="/admin/users" style={{ textDecoration: 'none', flexGrow: 1 }}>
            <div className="logo-container">
              <div className="logo-icon">
                <span className="material-symbols-outlined logo-svg">admin_panel_settings</span>
              </div>
              <div className="logo-text">
                <h2>Admin Portal</h2>
              </div>
            </div>
          </Link>
          
          <button className="btn-collapse-sidebar" onClick={toggleSidebar}>
            <span className="material-symbols-outlined">
              {isCollapsed ? 'chevron_right' : 'chevron_left'}
            </span>
          </button>
        </div>
        
        <ul className="nav-links">
          <li>
            <NavLink to="/admin/users" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <span className="material-symbols-outlined">group</span>
              <span>Người dùng</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/services" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <span className="material-symbols-outlined">category</span>
              <span>Dịch vụ Học</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/transactions" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <span className="material-symbols-outlined">payments</span>
              <span>Giao dịch</span>
            </NavLink>
          </li>

          {isSuperAdmin && (
            <>
              <div className="nav-divider"></div>
              <li>
                <NavLink to="/admin/staff" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
                  <span className="material-symbols-outlined">shield_person</span>
                  <span>Quản lý Nhân sự</span>
                </NavLink>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default AdminSidebar;