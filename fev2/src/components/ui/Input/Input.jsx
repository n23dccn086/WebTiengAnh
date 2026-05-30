import React, { useState } from 'react';
import './Input.css';

const Input = ({ label, type = 'text', ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="input-wrapper">
      {label && <label className="input-label">{label}</label>}
      <div className="input-container">
        <input 
          type={isPassword && showPassword ? 'text' : type} 
          className={`custom-input ${isPassword ? 'has-icon' : ''}`} 
          {...props} 
        />
        {isPassword && (
          <button 
            type="button" 
            className="eye-btn" 
            onClick={() => setShowPassword(!showPassword)}
            title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              {showPassword ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

export default Input;