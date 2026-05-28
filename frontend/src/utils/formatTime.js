// Định dạng số tiền (đã có trong formatCurrency.js riêng)
export const formatCurrency = (amount, locale = 'vi-VN', currency = 'VND') => {
  if (amount === undefined || amount === null) return '0đ';
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
};

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