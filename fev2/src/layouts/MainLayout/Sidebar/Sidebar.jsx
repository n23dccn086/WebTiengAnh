import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ isCollapsed, toggleSidebar }) => {
  return (
    <nav className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div>
        {/* WRAPPER CHỨA LOGO VÀ NÚT THU GỌN */}
        <div className="sidebar-header-wrapper">
          <Link to="/library" style={{ textDecoration: 'none', flexGrow: 1 }}>
            <div className="logo-container">
              <div className="logo-icon">
                <span className="material-symbols-outlined logo-svg">psychology</span>
              </div>
              <div className="logo-text">
                <h2>NeuralLearn</h2>
              </div>
            </div>
          </Link>
          
          {/* NÚT THU GỌN NẰM TRONG SIDEBAR */}
          <button className="btn-collapse-sidebar" onClick={toggleSidebar}>
            <span className="material-symbols-outlined">
              {isCollapsed ? 'chevron_right' : 'chevron_left'}
            </span>
          </button>
        </div>
        
        <ul className="nav-links">
          <li>
            <NavLink to="/library" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>folder</span>
              <span>Your library</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/daily-review" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <span className="material-symbols-outlined">style</span>
              <span>Daily Review</span>
            </NavLink>
          </li>
          
          <div className="nav-divider"></div>
          
          <li>
            <NavLink to="/create-deck" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <span className="material-symbols-outlined">add</span>
              <span>Create Deck</span>
            </NavLink>
          </li>
        </ul>
      </div>

      <div className="sidebar-bottom">
        <ul className="nav-links">
          <li>
            <NavLink to="/profile" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
              <span className="material-symbols-outlined">settings</span>
              <span>Settings</span>
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Sidebar;