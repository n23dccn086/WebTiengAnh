import { useEffect, useRef } from 'react';
import styles from './ShootingStars.module.css';

const ShootingStars = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let stars = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    class ShootingStar {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height * 0.5;
        this.length = Math.random() * 80 + 40;
        this.speedX = Math.random() * 6 + 4;
        this.speedY = this.speedX * 0.6;
        this.opacity = Math.random() * 0.5 + 0.5;
        this.active = true;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x > canvas.width || this.y > canvas.height) {
          this.reset();
        }
      }
      draw(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.length, this.y - this.length * 0.6);
        ctx.strokeStyle = `rgba(255, 240, 180, ${this.opacity})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    const initStars = (count = 5) => {
      stars = [];
      for (let i = 0; i < count; i++) stars.push(new ShootingStar());
    };
    initStars();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(star => {
        star.update();
        star.draw(ctx);
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

export default ShootingStars;