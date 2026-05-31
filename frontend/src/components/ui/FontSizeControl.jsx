import { useState, useEffect } from 'react';
import styles from './FontSizeControl.module.css';

const FontSizeControl = () => {
  const [fontSize, setFontSize] = useState(100);

  useEffect(() => {
    const saved = localStorage.getItem('fontSize');
    if (saved) {
      setFontSize(parseInt(saved));
      document.documentElement.style.fontSize = `${parseInt(saved)}%`;
    }
  }, []);

  const changeSize = (delta) => {
    let newSize = fontSize + delta;
    if (newSize < 50) newSize = 50;
    if (newSize > 150) newSize = 150;
    setFontSize(newSize);
    document.documentElement.style.fontSize = `${newSize}%`;
    localStorage.setItem('fontSize', newSize);
  };

  return (
    <div className={styles.container}>
      <button onClick={() => changeSize(-10)} className={styles.btn} title="Giảm cỡ chữ">A-</button>
      <span className={styles.percent}>{fontSize}%</span>
      <button onClick={() => changeSize(10)} className={styles.btn} title="Tăng cỡ chữ">A+</button>
    </div>
  );
};

export default FontSizeControl;