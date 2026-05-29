import styles from './StreakFlame.module.css';

const StreakFlame = ({ streak }) => {
  let bgClass = styles.bgOrange;
  if (streak >= 100) bgClass = styles.bgGold;
  else if (streak >= 70) bgClass = styles.bgGreen;
  else if (streak >= 50) bgClass = styles.bgBlue;
  else if (streak >= 30) bgClass = styles.bgPurple;

  return (
    <div className={`${styles.container} ${bgClass}`}>
      <div className={styles.flameIcon}>🔥</div>
      <div className={styles.streakCount}>{streak}</div>
      <div className={styles.label}>từ liên tiếp</div>
    </div>
  );
};

export default StreakFlame;