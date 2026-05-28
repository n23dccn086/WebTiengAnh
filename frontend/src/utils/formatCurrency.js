export const formatCurrency = (amount, locale = 'vi-VN', currency = 'VND') => {
  if (amount === undefined || amount === null) return '0đ';
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
};