import React from 'react';
import styles from './DocumentsButton.module.css';

const DocumentsButton = ({ onClick, children, className }) => {
  return (
    <button className={`${styles.documentsBtn} ${className || ''}`} onClick={onClick}>
      <div className={styles.folderContainer}>
        <svg
          className={styles.fileBack}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 5C4 4.44772 4.44772 4 5 4H9L11 6H19C19.5523 6 20 6.44772 20 7V19C20 19.5523 19.5523 20 19 20H5C4.44772 20 4 19.5523 4 19V5Z"
            fill="#3B82F6"
            stroke="#2563EB"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
        <svg
          className={styles.filePage}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7 8H17M7 12H14M7 16H10"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M7 8H17M7 12H14M7 16H10"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <rect x="6" y="4" width="12" height="16" rx="2" fill="#60A5FA" />
        </svg>
        <svg
          className={styles.fileFront}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="6" y="4" width="12" height="16" rx="2" fill="#2563EB" />
          <path d="M10 8H16M10 12H14M10 16H12" stroke="#BFDBFE" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <span className={styles.text}>{children || 'Tạo từ PDF'}</span>
    </button>
  );
};

export default DocumentsButton;