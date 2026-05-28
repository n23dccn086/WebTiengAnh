import styles from './SilentLizardButton.module.css';

const SilentLizardButton = ({ children, onClick, disabled = false, type = 'submit' }) => {
  return (
    <button className={styles.button} onClick={onClick} disabled={disabled} type={type}>
      {children}
    </button>
  );
};

export default SilentLizardButton;