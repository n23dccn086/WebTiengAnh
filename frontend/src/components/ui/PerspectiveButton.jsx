import React from 'react';
import styles from './PerspectiveButton.module.css';

const PerspectiveButton = ({ onClick, children, className }) => {
  return (
    <button className={`${styles.btn} ${className || ''}`} onClick={onClick}>
      {children}
    </button>
  );
};

export default PerspectiveButton;