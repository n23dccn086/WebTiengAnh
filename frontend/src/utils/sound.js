// frontend/src/utils/sound.js - 10 hiệu ứng âm thanh riêng biệt
let audioEnabled = true;
let audioCtx = null;

const getAudioContext = () => {
  if (!audioCtx && window.AudioContext) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
};

const playTone = (frequency, duration, volume = 0.3, type = 'sine', delay = 0) => {
  if (!audioEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = frequency;
    osc.type = type;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.00001, now + duration);
    osc.start(now);
    osc.stop(now + duration);
    if (ctx.state === 'suspended') ctx.resume();
  } catch (e) { console.log('Audio error:', e); }
};

// 1. Lật thẻ (tiếng lật giấy nhẹ)
export const playFlip = () => playTone(600, 0.06, 0.15, 'sine');

// 2. Đáp án đúng (ding dài, vui – 2 nốt)
export const playCorrect = () => {
  playTone(880, 0.15, 0.4);
  setTimeout(() => playTone(1046, 0.2, 0.4), 150);
};

// 3. Đáp án sai (buzz trầm, ngắn)
export const playWrong = () => playTone(220, 0.25, 0.3, 'sawtooth');

// 4. Ghép cặp đúng (tiếng "pop" nhanh, cao)
export const playMatch = () => playTone(1200, 0.08, 0.3, 'sine');

// 5. Ghép cặp sai (giống wrong nhưng ngắn hơn, âm thanh khác)
export const playError = () => playTone(180, 0.2, 0.25, 'square');

// 6. Chiến thắng game (fanfare 3 nốt)
export const playWin = () => {
  playTone(880, 0.15, 0.4);
  setTimeout(() => playTone(1046, 0.2, 0.4), 150);
  setTimeout(() => playTone(1318, 0.3, 0.4), 300);
};

// 7. Hoàn thành phiên SRS (dùng âm thanh riêng, 2 nốt ngắn)
export const playCompleteSession = () => {
  playTone(660, 0.2, 0.3);
  setTimeout(() => playTone(880, 0.2, 0.3), 200);
};

// 8. Nộp bài test (giống win nhưng nhẹ hơn, 2 nốt)
export const playSubmitTest = () => {
  playTone(800, 0.12, 0.35);
  setTimeout(() => playTone(1000, 0.15, 0.35), 120);
};

// 9. Upload PDF thành công (ding đơn, ngắn)
export const playUploadSuccess = () => playTone(1000, 0.12, 0.3, 'sine');

// 10. Upload PDF thất bại (buzz trầm, dài hơn wrong)
export const playUploadError = () => playTone(150, 0.35, 0.25, 'sawtooth');

// 11. Thông báo (pop nhẹ) – dùng cho chat
export const playNotification = () => playTone(1400, 0.05, 0.2, 'sine');

// Bật/tắt âm thanh toàn cục (tuỳ chọn)
export const setAudioEnabled = (enabled) => {
  audioEnabled = enabled;
  localStorage.setItem('audioEnabled', enabled);
};
export const getAudioEnabled = () => {
  const saved = localStorage.getItem('audioEnabled');
  if (saved !== null) audioEnabled = saved === 'true';
  return audioEnabled;
};