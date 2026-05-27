import confetti from 'canvas-confetti';

export const fireConfetti = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    startVelocity: 20,
    colors: ['#ff9a9e', '#fad0c4', '#fad0c4', '#ffd966']
  });
};