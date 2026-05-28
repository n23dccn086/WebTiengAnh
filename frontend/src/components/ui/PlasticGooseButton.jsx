import styles from './PlasticGooseButton.module.css';

const PlasticGooseButton = ({ children, onClick, className = '', disabled = false, type = 'button' }) => {
  return (
    <button className={`${styles.button} ${className}`} onClick={onClick} disabled={disabled} type={type}>
      {children}
    </button>
  );
};

export default PlasticGooseButton;