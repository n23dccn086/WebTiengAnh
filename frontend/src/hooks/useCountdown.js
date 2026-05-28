import { useState, useEffect, useRef } from 'react';

export const useCountdown = (initialSeconds, onComplete) => {
  const [seconds, setSeconds] = useState(initialSeconds);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (seconds <= 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (onComplete) onComplete();
      return;
    }
    intervalRef.current = setInterval(() => {
      setSeconds(prev => prev - 1);
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [seconds, onComplete]);

  const reset = (newSeconds) => {
    setSeconds(newSeconds);
  };

  return { seconds, reset };
};