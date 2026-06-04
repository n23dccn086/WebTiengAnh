import { useState, useEffect, useRef } from 'react';
import styles from './EffectToggles.module.css';

const EffectToggles = ({ isPremium, onToggle }) => {
  // State cho hiệu ứng hình ảnh
  const [effects, setEffects] = useState({
    shootingStars: false,
    rain: false,
    snow: false,
    leaves: false,
  });

  // State cho âm thanh (bật/tắt)
  const [soundEffects, setSoundEffects] = useState({
    rainSound: false,
    windSound: false,
  });

  // Refs để điều khiển Audio object
  const rainAudioRef = useRef(null);
  const windAudioRef = useRef(null);

  // Khởi tạo Audio objects (chỉ 1 lần)
  useEffect(() => {
    rainAudioRef.current = new Audio('/sounds/rain_loop.mp3');
    rainAudioRef.current.loop = true;
    windAudioRef.current = new Audio('/sounds/wave_loop.mp3');
    windAudioRef.current.loop = true;
  }, []);

  // Load trạng thái từ localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dashboardEffects');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setEffects(prev => ({ ...prev, ...parsed }));
      } catch (err) {}
    }
    const savedSounds = localStorage.getItem('dashboardSoundEffects');
    if (savedSounds) {
      try {
        const parsed = JSON.parse(savedSounds);
        setSoundEffects(parsed);
      } catch (err) {}
    }
  }, []);

  // Điều khiển âm thanh khi soundEffects thay đổi
  useEffect(() => {
    if (soundEffects.rainSound) {
      rainAudioRef.current?.play().catch(e => console.log('Audio play fail:', e));
    } else {
      rainAudioRef.current?.pause();
    }
  }, [soundEffects.rainSound]);

  useEffect(() => {
    if (soundEffects.windSound) {
      windAudioRef.current?.play().catch(e => console.log('Audio play fail:', e));
    } else {
      windAudioRef.current?.pause();
    }
  }, [soundEffects.windSound]);

  // Lưu trạng thái âm thanh
  useEffect(() => {
    localStorage.setItem('dashboardSoundEffects', JSON.stringify(soundEffects));
  }, [soundEffects]);

  // Toggle hiệu ứng hình ảnh
  const toggleEffect = (name) => {
    const newEffects = { ...effects, [name]: !effects[name] };
    setEffects(newEffects);
    localStorage.setItem('dashboardEffects', JSON.stringify(newEffects));
    if (onToggle) onToggle(newEffects);
  };

  // Toggle âm thanh riêng
  const toggleSound = (name) => {
    setSoundEffects(prev => ({ ...prev, [name]: !prev[name] }));
  };

  if (!isPremium) return null;

  return (
    <div className={styles.toggleBar}>
      {/* Nút hiệu ứng hình ảnh */}
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

      {/* Nút âm thanh riêng */}
      <button
        className={`${styles.toggleBtn} ${soundEffects.rainSound ? styles.active : ''}`}
        onClick={() => toggleSound('rainSound')}
      >
        💧 Mưa (âm thanh)
      </button>
      <button
        className={`${styles.toggleBtn} ${soundEffects.windSound ? styles.active : ''}`}
        onClick={() => toggleSound('windSound')}
      >
        🌊 Sóng (âm thanh)
      </button>
    </div>
  );
};

export default EffectToggles;