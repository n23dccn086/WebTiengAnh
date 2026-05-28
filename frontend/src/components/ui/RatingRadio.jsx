import styles from './RatingRadio.module.css';

const RatingRadio = ({ name, value, label, checked, onChange }) => {
  return (
    <label className={styles.radioLabel}>
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className={styles.radioInput} />
      <span className={styles.radioCustom}></span>
      <span className={styles.radioText}>{label}</span>
    </label>
  );
};

export default RatingRadio;