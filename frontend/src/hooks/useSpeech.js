const useSpeech = () => {
  const speak = (text, lang = 'en-US') => {
    if (!window.speechSynthesis) {
      console.warn('Trình duyệt không hỗ trợ SpeechSynthesis API');
      return;
    }
    // Dừng mọi phát âm đang diễn ra để tránh chồng chéo
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9; // Tốc độ đọc (0.1 - 10)
    utterance.pitch = 1;   // Cao độ (0 - 2)
    window.speechSynthesis.speak(utterance);
  };

  return { speak };
};

export default useSpeech;