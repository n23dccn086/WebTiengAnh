// src/components/ui/PremiumModal.jsx
import React, { useState } from 'react';
import apiClient from '../../../services/apiClient';
import useAuthStore from '../../../store/authStore';
import './PremiumModal.css';

const PremiumModal = ({ onClose }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { user, loginSuccess } = useAuthStore(); // Lấy hàm update store

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      // GỌI API 1: Tạo giao dịch MoMo
      const res = await apiClient.post('/payments/momo');
      const { payUrl } = res.data.data;

      if (payUrl) {
        // Có URL thật từ MoMo -> Chuyển hướng sang trang thanh toán MoMo
        window.location.href = payUrl;
      } else {
        // NẾU ĐANG TEST GIẢ LẬP (payUrl = null) -> Nâng cấp luôn
        throw new Error("Mock"); 
      }
    } catch (error) {
      // GIẢ LẬP THANH TOÁN THÀNH CÔNG (Để test tính năng)
      const token = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      
      // Update lại thông tin user trong LocalStorage & Zustand State
      loginSuccess({ ...user, role: 'PREMIUM', ai_quota: 200 }, token, refreshToken);
      
      alert("Đã giả lập thanh toán thành công! Chào mừng đến với gói PRO.");
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="premium-overlay" onClick={onClose}>
      <div className="premium-modal" onClick={e => e.stopPropagation()}>
        <button className="premium-close" onClick={onClose}>
          <span className="material-symbols-outlined">close</span>
        </button>
        
        <span className="material-symbols-outlined" style={{ fontSize: '48px', color: '#FFD15B', marginBottom: '16px' }}>workspace_premium</span>
        <h2 className="premium-title">Nâng cấp PRO</h2>
        <p style={{ color: '#8A8A9D' }}>Mở khóa sức mạnh AI để tăng 300% tốc độ học tập.</p>

        <div className="premium-features">
          <div className="feature-item">
            <span className="material-symbols-outlined">check_circle</span>
            Trích xuất từ vựng từ PDF (Không giới hạn)
          </div>
          <div className="feature-item">
            <span className="material-symbols-outlined">check_circle</span>
            AI Tutor phân tích và giải thích lỗi sai chi tiết
          </div>
          <div className="feature-item">
            <span className="material-symbols-outlined">check_circle</span>
            Thống kê tiến độ & thuật toán học sâu (SM-2)
          </div>
        </div>

        <button className="btn-momo" onClick={handlePayment} disabled={isProcessing}>
          <span className="material-symbols-outlined">account_balance_wallet</span>
          {isProcessing ? 'Đang tạo giao dịch...' : 'Thanh toán qua MoMo - 49.000đ'}
        </button>
      </div>
    </div>
  );
};

export default PremiumModal;