import { useEffect, useRef } from 'react';
import styles from './Rain.module.css';

const Rain = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let raindrops = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    class Raindrop {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
         this.length = Math.random() * 15 + 12;
        this.speed = Math.random() * 5 + 4;  
        this.opacity = Math.random() * 0.5 + 0.3; 
      }
      update() {
        this.y += this.speed;
        if (this.y > canvas.height) {
          this.y = -this.length;
          this.x = Math.random() * canvas.width;
        }
      }
      draw(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - 2, this.y + this.length);
        ctx.strokeStyle = `rgba(0, 150, 200, ${this.opacity})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    }

    const initRain = (count = 70) => {
      raindrops = [];
      for (let i = 0; i < count; i++) raindrops.push(new Raindrop());
    };
    initRain();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      raindrops.forEach(drop => {
        drop.update();
        drop.draw(ctx);
      });
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} />;
};

export default Rain;