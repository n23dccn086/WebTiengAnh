import { useState, useEffect, useRef } from 'react';
import styles from './BackgroundMusic.module.css';

const BackgroundMusic = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('bgMusicEnabled');
    if (saved === 'true') setIsPlaying(true);
  }, []);

  useEffect(() => {
    if (isPlaying) {
      if (!audioRef.current) {
        audioRef.current = new Audio('/music/relax.mp3');
        audioRef.current.loop = true;
        audioRef.current.volume = 0.3;
      }
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
      localStorage.setItem('bgMusicEnabled', 'true');
    } else {
      if (audioRef.current) audioRef.current.pause();
      localStorage.setItem('bgMusicEnabled', 'false');
    }
  }, [isPlaying]);

  const toggle = () => setIsPlaying(!isPlaying);

  return (
    <button className={styles.musicBtn} onClick={toggle} title={isPlaying ? 'Tắt nhạc' : 'Bật nhạc'}>
      {isPlaying ? '🐱' : '🙉'}
    </button>
  );
};

export default BackgroundMusic;