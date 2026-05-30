import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader'; // 🟢 Import Header mới tạo
import "../MainLayout/MainLayout.css";

const AdminLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="main-layout-container">
      <AdminSidebar 
        isCollapsed={isCollapsed} 
        toggleSidebar={() => setIsCollapsed(!isCollapsed)} 
      />
      
      {/* 🟢 Dùng AdminHeader thay vì Header của User */}
      <AdminHeader 
        isCollapsed={isCollapsed} 
      />
      
      <main className={`main-content-area ${isCollapsed ? 'collapsed' : ''}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;