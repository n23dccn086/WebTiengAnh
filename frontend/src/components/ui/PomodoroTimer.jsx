import { useState, useEffect, useRef } from 'react';
import styles from './PomodoroTimer.module.css';

const PomodoroTimer = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('work'); // 'work' or 'break'
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const audioContextRef = useRef(null);
  const intervalRef = useRef(null);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0 });

  // Load saved state: collapsed & position
  useEffect(() => {
    const savedCollapsed = localStorage.getItem('pomodoroCollapsed');
    if (savedCollapsed !== null) setCollapsed(savedCollapsed === 'true');
    const savedPos = localStorage.getItem('pomodoroPosition');
    if (savedPos) setPosition(JSON.parse(savedPos));
  }, []);

  const toggleCollapse = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem('pomodoroCollapsed', newState);
  };

  // Drag only when expanded
  const handleMouseDown = (e) => {
    if (collapsed) return;
    if (e.target.closest(`.${styles.controls}`) || e.target.closest(`.${styles.settings}`) || e.target.closest(`.${styles.collapseBtn}`)) return;
    setIsDragging(true);
    dragRef.current = { startX: e.clientX - position.x, startY: e.clientY - position.y };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      setPosition({
        x: e.clientX - dragRef.current.startX,
        y: e.clientY - dragRef.current.startY,
      });
    };
    const handleMouseUp = () => {
      if (isDragging) {
        localStorage.setItem('pomodoroPosition', JSON.stringify(position));
        setIsDragging(false);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, position]);

  // Play alarm sound using Web Audio API
  const playAlarm = () => {
    try {
      if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = new AudioContext();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
      osc.start();
      osc.stop(now + 0.8);
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.value = 880;
        gain2.gain.setValueAtTime(0.3, now + 0.6);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
        osc2.start(now + 0.6);
        osc2.stop(now + 1.4);
      }, 600);
    } catch (e) {
      console.log('Alarm sound error:', e);
    }
  };

  const showCustomAlert = (message) => {
    setAlertMessage(message);
    setShowAlert(true);
    playAlarm();
    setTimeout(() => setShowAlert(false), 6000);
  };

  // Timer logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            const nextMode = mode === 'work' ? 'break' : 'work';
            const nextMinutes = nextMode === 'work' ? workMinutes : breakMinutes;
            if (mode === 'work') {
              showCustomAlert('🍅 Hết giờ làm việc! Đã đến lúc nghỉ ngơi.');
            } else {
              showCustomAlert('☕ Hết giờ nghỉ! Bắt đầu làm việc lại nào.');
            }
            setMode(nextMode);
            setMinutes(nextMinutes);
            setSeconds(0);
            return;
          } else {
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        } else {
          setSeconds(seconds - 1);
        }
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, minutes, seconds, mode, workMinutes, breakMinutes]);

  const handleWorkChange = (e) => {
    let val = parseInt(e.target.value);
    if (isNaN(val)) val = 1;
    val = Math.min(60, Math.max(1, val));
    setWorkMinutes(val);
    if (mode === 'work' && !isRunning) setMinutes(val);
  };

  const handleBreakChange = (e) => {
    let val = parseInt(e.target.value);
    if (isNaN(val)) val = 1;
    val = Math.min(30, Math.max(1, val));
    setBreakMinutes(val);
    if (mode === 'break' && !isRunning) setMinutes(val);
  };

  const reset = () => {
    setIsRunning(false);
    setMinutes(mode === 'work' ? workMinutes : breakMinutes);
    setSeconds(0);
  };

  useEffect(() => {
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

  // Collapsed view
  if (collapsed) {
    return (
      <div
        className={`${styles.container} ${styles.collapsed}`}
        style={{ left: position.x, top: position.y }}
        onMouseDown={handleMouseDown}
      >
        <button className={styles.expandBtn} onClick={toggleCollapse} title="Mở rộng">
          🍅
        </button>
      </div>
    );
  }

  // Expanded view
  return (
    <div
      className={styles.container}
      style={{ left: position.x, top: position.y }}
      onMouseDown={handleMouseDown}
    >
      <div className={styles.header}>
        <span>🍅 Pomodoro</span>
        <button className={styles.collapseBtn} onClick={toggleCollapse} title="Thu gọn">−</button>
      </div>
      <div className={styles.settings}>
        <label>Làm:
          <input type="number" value={workMinutes} onChange={handleWorkChange} min={1} max={60} step={1} />
        </label>
        <label>Nghỉ:
          <input type="number" value={breakMinutes} onChange={handleBreakChange} min={1} max={30} step={1} />
        </label>
      </div>
      <div className={styles.timer}>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>
      <div className={styles.controls}>
        {!isRunning ? (
          <button onClick={() => setIsRunning(true)} className={styles.btn}>▶️</button>
        ) : (
          <button onClick={() => setIsRunning(false)} className={styles.btn}>⏸️</button>
        )}
        <button onClick={reset} className={styles.btn}>🔄</button>
      </div>
      <div className={styles.mode}>{mode === 'work' ? '📚 Làm việc' : '☕ Nghỉ ngơi'}</div>
      {showAlert && (
        <div className={styles.alertOverlay}>
          <div className={styles.alertBox}>
            <div className={styles.alertIcon}>⏰</div>
            <div className={styles.alertMessage}>{alertMessage}</div>
            <button className={styles.alertCloseBtn} onClick={() => setShowAlert(false)}>Đóng</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PomodoroTimer;