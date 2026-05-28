import styles from './ShortWarthogFileInput.module.css';

const ShortWarthogFileInput = ({ onChange, accept, label = 'Chọn file' }) => {
  return (
    <div className={styles.fileInputWrapper}>
      <label className={styles.customFileLabel}>
        📁 {label}
        <input type="file" accept={accept} onChange={onChange} className={styles.fileInput} />
      </label>
    </div>
  );
};

export default ShortWarthogFileInput;