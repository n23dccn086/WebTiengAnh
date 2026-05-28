import styles from './MightyMooseButton.module.css';

const MightyMooseButton = ({ children, onClick, className = '', disabled = false }) => {
  return (
    <button className={`${styles.button} ${className}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
};

export default MightyMooseButton;