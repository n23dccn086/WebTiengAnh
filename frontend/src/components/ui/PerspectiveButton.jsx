import React from 'react';
import styles from './PerspectiveButton.module.css';

const PerspectiveButton = ({ onClick, children, className, style, color = 'green', type = 'button', disabled = false }) => {
  const colorStyles = {
    green: { '--color1': '#1a8516', '--color2': '#236b19' },
    pink:  { '--color1': '#ff9a9e', '--color2': '#fad0c4' },
    blue:  { '--color1': '#3b82f6', '--color2': '#1d4ed8' },
    purple:{ '--color1': '#8b5cf6', '--color2': '#6d28d9' },
    red:   { '--color1': '#ef4444', '--color2': '#dc2626' },
    yellow:{ '--color1': '#f59e0b', '--color2': '#d97706' },
  };
  const selectedColor = colorStyles[color] || colorStyles.green;

  return (
    <button
      type={type}
      className={`${styles.btn} ${className || ''}`}
      onClick={onClick}
      disabled={disabled}
      style={{ ...selectedColor, ...style }}
    >
      {children}
    </button>
  );
};

export default PerspectiveButton;