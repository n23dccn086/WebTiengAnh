// File: src/tests/unit/sm2Algorithm.test.js
const { calculateSM2 } = require('../../src/utils/sm2Algorithm');

describe('Kiểm thử thuật toán Spaced Repetition (SM-2)', () => {

  test('Trường hợp 1: Chọn AGAIN (Quên từ) -> Phải học lại từ đầu', () => {
    // Giả sử thẻ đang ở mức dễ (easeFactor 2.5), cách 6 ngày, đã lặp 2 lần. Nhưng nay user quên.
    const result = calculateSM2(2.5, 6, 2, 'AGAIN');
    
    expect(result.repetitionCount).toBe(0); // Lặp lại từ đầu
    expect(result.intervalDays).toBe(1);    // Ngày mai học lại luôn
    expect(result.easeFactor).toBeLessThan(2.5); // Độ khó tăng lên (ease factor giảm)
  });

  test('Trường hợp 2: Chọn GOOD lần đầu tiên -> Khoảng cách là 1 ngày', () => {
    // Thẻ mới tinh
    const result = calculateSM2(2.5, 0, 0, 'GOOD');
    
    expect(result.repetitionCount).toBe(1);
    expect(result.intervalDays).toBe(1);
  });

  test('Trường hợp 3: Chọn GOOD lần thứ 2 -> Khoảng cách là 6 ngày', () => {
    // Thẻ đã học 1 lần
    const result = calculateSM2(2.5, 1, 1, 'GOOD');
    
    expect(result.repetitionCount).toBe(2);
    expect(result.intervalDays).toBe(6); // Đúng như logic sm2Algorithm của bạn
  });

  test('Trường hợp 4: Chọn EASY -> Khoảng cách tăng vọt', () => {
    // Thẻ đã học 2 lần (đang cách 6 ngày)
    const result = calculateSM2(2.5, 6, 2, 'EASY');
    
    expect(result.repetitionCount).toBe(3);
    expect(result.intervalDays).toBeGreaterThan(6); // Sẽ được đẩy đi rất xa
    expect(result.easeFactor).toBeGreaterThan(2.5); // Độ dễ tăng lên
  });

});