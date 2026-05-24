import React from 'react';
import styles from './LogoutButton.module.css';

const LogoutButton = ({ onClick, className = '' }) => {
  return (
    <button className={`${styles.Btn} ${className}`} onClick={onClick}>
      <div className={styles.sign}>
        <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
          <path d="M304 336v40a40 40 0 0 1-40 40H104a40 40 0 0 1-40-40V136a40 40 0 0 1 40-40h152c22.09 0 48 17.91 48 40v40M368 336l80-80-80-80M176 256h256" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="32"/>
        </svg>
      </div>
      <div className={styles.text}>Logout</div>
    </button>
  );
};

export default LogoutButton;