import React from 'react';
import styles from './NeonToggle.module.css';

const NeonToggle = ({ checked, onChange, id }) => {
  return (
    <>
      <input type="checkbox" id={id} checked={checked} onChange={onChange} className={styles.checkbox} />
      <label htmlFor={id} className={styles.switch}>
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 4V20M20 12H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </label>
    </>
  );
};

export default NeonToggle;