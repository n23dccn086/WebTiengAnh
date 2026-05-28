import styles from './GrumpySwanInput.module.css';

const GrumpySwanInput = ({ label, type = 'text', value, onChange, placeholder, required = false, disabled = false }) => {
  return (
    <div className={styles.inputGroup}>
      {label && <label className={styles.label}>{label}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={styles.input}
      />
    </div>
  );
};

export default GrumpySwanInput;