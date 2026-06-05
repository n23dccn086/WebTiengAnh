const authService = require('../../src/services/auth.service');
const db = require('../../src/config/database');
const bcrypt = require('bcryptjs');

// Mock toàn bộ module database cho an toàn nhất
jest.mock('../../src/config/database', () => {
  const mDb = { query: jest.fn(), execute: jest.fn() };
  return {
    ...mDb,
    pool: mDb,
    rawPool: mDb,
    checkConnection: jest.fn()
  };
});

jest.mock('bcryptjs');
jest.mock('../../src/config/email', () => ({
  sendVerificationEmail: jest.fn()
}));

describe('Authentication Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('TC-01: Đăng ký thành công tạo user UNVERIFIED', async () => {
    db.execute.mockResolvedValueOnce([[]]); 
    db.execute.mockResolvedValueOnce([{ insertId: 1 }]); 
    db.execute.mockResolvedValueOnce([{ insertId: 2 }]); 
    
    bcrypt.hash.mockResolvedValue('hashed_Abc123!');

    const userData = { email: "user@example.com", password: "Abc123!", full_name: "Nguyễn Văn A" };

    // Sửa lại cách gọi hàm: Truyền 3 tham số rời
    const result = await authService.register(userData.email, userData.password, userData.full_name);

    expect(result.status).toBe('UNVERIFIED');
  });

  test('TC-03: Đăng nhập sai mật khẩu ném ra lỗi HTTP 401', async () => {
    const mockUser = { id: 1, email: 'user@example.com', password_hash: 'hash_cu', status: 'ACTIVE' };
    
    // Đảm bảo db.execute luôn trả về mockUser khi được model gọi
    db.execute.mockResolvedValue([[mockUser]]);
    bcrypt.compare.mockResolvedValue(false);

    await expect(authService.login('user@example.com', 'wrong'))
      .rejects
      .toMatchObject({ statusCode: 401 });
  });
});