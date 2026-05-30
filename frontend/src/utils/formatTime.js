// Định dạng thời gian đếm ngược (giây -> mm:ss)
export const formatCountdown = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Định dạng ngày tháng
export const formatDate = (date, locale = 'vi-VN') => {
  return new Date(date).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
};