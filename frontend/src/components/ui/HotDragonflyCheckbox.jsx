import styles from './HotDragonflyCheckbox.module.css';

const HotDragonflyCheckbox = ({ label, checked, onChange, id }) => {
  return (
    <label className={styles.checkboxContainer}>
      <input type="checkbox" checked={checked} onChange={onChange} id={id} />
      <span className={styles.checkmark}></span>
      {label && <span className={styles.label}>{label}</span>}
    </label>
  );
};

export default HotDragonflyCheckbox;