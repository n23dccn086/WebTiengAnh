const cron = require('node-cron');
const db = require('../../src/config/database');

// Mock node-cron để bắt cái hàm callback bên trong
jest.mock('node-cron', () => ({
  schedule: jest.fn()
}));

jest.mock('../../src/config/database', () => ({
  query: jest.fn(),
  execute: jest.fn()
}));

describe('Cron Job: Reset AI Quota', () => {
  beforeEach(() => {
    jest.clearAllMocks(); 
  });

  test('Phải thực thi 2 câu lệnh SQL', async () => {
    db.query.mockResolvedValue([{ affectedRows: 5 }]);
    db.execute.mockResolvedValue([{ affectedRows: 5 }]);

    // 1. Khởi chạy file job (Nó sẽ gọi hàm cron.schedule)
    const startResetQuotaJob = require('../../src/cron/resetQuota.job');
    startResetQuotaJob();

    // 2. Trích xuất cái ruột async () => { ... } mà bạn đã ném vào cron.schedule
    const cronCallback = cron.schedule.mock.calls[0][1];
    
    // 3. Tự tay kích hoạt cái ruột đó chạy
    await cronCallback();

    // 4. Kiểm tra xem DB có bị chọc vào đúng 2 lần không (gom chung cả query và execute)
    const allDbCalls = [...db.query.mock.calls, ...db.execute.mock.calls];
    expect(allDbCalls.length).toBeGreaterThanOrEqual(2);

    expect(allDbCalls[0][0]).toMatch(/UPDATE users\s+SET ai_quota/i);
    expect(allDbCalls[1][0]).toMatch(/premium_until < NOW/i);
  });
});