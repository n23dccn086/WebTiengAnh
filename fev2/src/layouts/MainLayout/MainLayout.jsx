// src/components/layout/MainLayout/MainLayout.jsx
import React, { useState } from 'react';
import Sidebar from './Sidebar/Sidebar';
import Header from './Header/Header';
import PremiumModal from "../../components/ui/PremiumModal/PremiumModal";
import './MainLayout.css';

const MainLayout = ({ children, title }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  return (
    <div className="main-layout-container">
      {/* TRUYỀN HÀM TOGGLE CHO SIDEBAR */}
      <Sidebar 
        isCollapsed={isCollapsed} 
        toggleSidebar={() => setIsCollapsed(!isCollapsed)} 
      />
      
      {/* HEADER BÂY GIỜ KHÔNG CẦN CHỨA NÚT TOGGLE NỮA */}
      <Header 
        title={title} 
        isCollapsed={isCollapsed} 
        onOpenPremium={() => setShowPremiumModal(true)}
      />
      
      <main className={`main-content-area ${isCollapsed ? 'collapsed' : ''}`}>
        {children}
      </main>

      {showPremiumModal && (
        <PremiumModal onClose={() => setShowPremiumModal(false)} />
      )}
    </div>
  );
};

export default MainLayout;