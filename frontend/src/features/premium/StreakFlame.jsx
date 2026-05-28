import styles from './StreakFlame.module.css';

const StreakFlame = ({ streak }) => {
  return (
    <div className={styles.container}>
      <div className={styles.flameIcon}>🔥</div>
      <div className={styles.streakCount}>{streak}</div>
      <div className={styles.label}>ngày liên tiếp</div>
    </div>
  );
};

export default StreakFlame;