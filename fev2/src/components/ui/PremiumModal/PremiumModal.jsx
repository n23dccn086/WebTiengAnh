// src/components/ui/PremiumModal/PremiumModal.jsx
import React, { useState } from 'react';
import apiClient from '../../../services/apiClient';
import useAuthStore from '../../../store/authStore';
import './PremiumModal.css';

const PremiumModal = ({ onClose }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { user, loginSuccess } = useAuthStore();

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      // 1. Gọi API tạo giao dịch MoMo
      const res = await apiClient.post('/payments/momo');
      const { payUrl } = res.data.data;

      if (payUrl) {
        // 2a. Nếu có URL thật -> Chuyển hướng sang trang thanh toán MoMo
        window.location.href = payUrl;
      } else {
        // 2b. MOCK MODE (Khi chưa cấu hình MoMo thật)
        const token = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        loginSuccess({ ...user, role: 'PREMIUM', ai_quota: 200 }, token, refreshToken);
        alert("Đã giả lập thanh toán thành công! Chào mừng đến với gói PRO.");
        onClose();
      }
    } catch (error) {
      console.error("Lỗi tạo giao dịch:", error);
      alert("Hệ thống thanh toán đang bảo trì, vui lòng thử lại sau.");
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
        
        <span className="material-symbols-outlined" style={{ fontSize: '52px', color: 'var(--accent-neon)', marginBottom: '16px', filter: 'drop-shadow(0 0 10px var(--accent-dim))' }}>
          auto_awesome
        </span>
        <h2 className="premium-title">Nâng cấp <span>PRO</span></h2>
        <p style={{ color: 'var(--text-muted)' }}>Mở khóa sức mạnh AI để tăng tốc độ học tập.</p>

        <div className="premium-features">
          <div className="feature-item">
            <span className="material-symbols-outlined">verified</span>
            Trích xuất từ vựng từ PDF (Không giới hạn)
          </div>
          <div className="feature-item">
            <span className="material-symbols-outlined">verified</span>
            AI Tutor phân tích và giải thích chi tiết
          </div>
          <div className="feature-item">
            <span className="material-symbols-outlined">verified</span>
            Thuật toán học sâu Spaced Repetition (SM-2)
          </div>
        </div>

        <button className="btn-momo" onClick={handlePayment} disabled={isProcessing}>
          <span className="material-symbols-outlined">account_balance_wallet</span>
          {isProcessing ? 'Đang kết nối MoMo...' : 'Thanh toán MoMo - 49.000đ'}
        </button>
      </div>
    </div>
  );
};

export default PremiumModal;