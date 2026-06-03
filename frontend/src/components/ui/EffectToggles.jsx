import { useState, useEffect } from 'react';
import styles from './EffectToggles.module.css';

const EffectToggles = ({ isPremium, onToggle }) => {
  const [effects, setEffects] = useState({
    shootingStars: false,
    rain: false,
    snow: false,
    leaves: false,
  });

  useEffect(() => {
    const saved = localStorage.getItem('dashboardEffects');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setEffects(prev => ({ ...prev, ...parsed }));
      } catch (err) {
        console.error('Lỗi đọc localStorage:', err);
      }
    }
  }, []);

  const toggleEffect = (name) => {
    const newEffects = { ...effects, [name]: !effects[name] };
    setEffects(newEffects);
    localStorage.setItem('dashboardEffects', JSON.stringify(newEffects));
    if (onToggle) onToggle(newEffects);
  };

  if (!isPremium) return null;

  return (
    <div className={styles.toggleBar}>
      <button
        className={`${styles.toggleBtn} ${effects.shootingStars ? styles.active : ''}`}
        onClick={() => toggleEffect('shootingStars')}
      >
        ✨ Sao băng
      </button>
      <button
        className={`${styles.toggleBtn} ${effects.rain ? styles.active : ''}`}
        onClick={() => toggleEffect('rain')}
      >
        🌧️ Mưa
      </button>
      <button
        className={`${styles.toggleBtn} ${effects.snow ? styles.active : ''}`}
        onClick={() => toggleEffect('snow')}
      >
        ❄️ Tuyết
      </button>
      <button
        className={`${styles.toggleBtn} ${effects.leaves ? styles.active : ''}`}
        onClick={() => toggleEffect('leaves')}
      >
        🍃 Lá rơi
      </button>
    </div>
  );
};

export default EffectToggles;