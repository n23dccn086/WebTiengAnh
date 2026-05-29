// src/pages/PaymentResult/PaymentResult.jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loginSuccess } = useAuthStore();
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    // MoMo trả về tham số resultCode trên URL
    const resultCode = searchParams.get('resultCode');
    
    if (resultCode === '0') {
      setStatus('success');
      
      // 🟢 FIX LỖI VÒNG LẶP: Chỉ gọi loginSuccess nếu user CHƯA là PREMIUM
      if (user && user.role !== 'PREMIUM') {
        const token = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        loginSuccess({ ...user, role: 'PREMIUM', ai_quota: 200 }, token, refreshToken);
      }
      
    } else if (resultCode) {
      setStatus('error');
    } else {
      setStatus('invalid');
    }
  }, [searchParams, user, loginSuccess]);

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-main)' }}>
      <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'var(--surface)', borderRadius: '24px', border: '1px solid var(--border-subtle)' }}>
        
        {status === 'processing' && (
          <h2 style={{ color: 'var(--text-main)' }}>Đang xử lý kết quả thanh toán...</h2>
        )}

        {status === 'success' && (
          <>
            <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'var(--accent-neon)' }}>check_circle</span>
            <h2 style={{ color: 'var(--text-main)', marginTop: '16px' }}>Thanh toán thành công!</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Tài khoản của bạn đã được nâng cấp lên gói PRO.</p>
            <button onClick={() => navigate('/library')} style={{ padding: '12px 24px', backgroundColor: 'var(--accent)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
              Bắt đầu học ngay
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'var(--error)' }}>cancel</span>
            <h2 style={{ color: 'var(--text-main)', marginTop: '16px' }}>Thanh toán thất bại</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Giao dịch đã bị hủy hoặc có lỗi xảy ra.</p>
            <button onClick={() => navigate('/library')} style={{ padding: '12px 24px', backgroundColor: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border-subtle)', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
              Quay về thư viện
            </button>
          </>
        )}

        {status === 'invalid' && (
          <h2 style={{ color: 'var(--text-main)' }}>Đường dẫn không hợp lệ</h2>
        )}

      </div>
    </div>
  );
};

export default PaymentResult;