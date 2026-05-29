import React from 'react';

const LeaveModal = ({ onSaveAndLeave, onDiscard, onCancel }) => {
  return (
    <div className="leave-modal-overlay">
      <div className="leave-modal glass-panel">
        <span className="material-symbols-outlined leave-modal-icon">warning</span>
        <h3>Bạn có thay đổi chưa lưu</h3>
        <p>Nếu rời đi, toàn bộ dữ liệu đang nhập sẽ bị mất. Bạn muốn làm gì?</p>
        <div className="leave-modal-actions">
          <button className="btn-leave-save" onClick={onSaveAndLeave}>
            <span className="material-symbols-outlined">task_alt</span>
            Lưu thẻ & Thoát
          </button>
          <button className="btn-leave-discard" onClick={onDiscard}>Bỏ thay đổi & Rời đi</button>
          <button className="btn-leave-cancel" onClick={onCancel}>Ở lại trang này</button>
        </div>
      </div>
    </div>
  );
};

export default LeaveModal;