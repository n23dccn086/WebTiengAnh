let audioEnabled = true;

const playSound = (filename) => {
  if (!audioEnabled) return;
  const audio = new Audio(`/sounds/${filename}`);
  audio.volume = 0.5;
  audio.play().catch(e => console.log('Audio error:', e));
};

export const playFlip = () => playSound('flip.wav');
export const playCorrect = () => playSound('correct.wav');
export const playWrong = () => playSound('wrong.wav');
export const playMatch = () => playSound('match.wav');
export const playError = () => playSound('error.wav');
export const playWin = () => playSound('win.wav');
export const playCompleteSession = () => playSound('complete.wav');
export const playSubmitTest = () => playSound('submit.wav');
export const playUploadSuccess = () => playSound('upload_success.wav');
export const playUploadError = () => playSound('upload_error.wav');
export const playNotification = () => playSound('notification.wav');
export const playComplete = playCompleteSession;
export const setAudioEnabled = (enabled) => {
  audioEnabled = enabled;
  localStorage.setItem('audioEnabled', enabled);
};
export const getAudioEnabled = () => {
  const saved = localStorage.getItem('audioEnabled');
  if (saved !== null) audioEnabled = saved === 'true';
  return audioEnabled;
};