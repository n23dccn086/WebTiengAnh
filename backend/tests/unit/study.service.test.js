const studyService = require('../../src/services/study.service');
const db = require('../../src/config/database');
const StudyModel = require('../../src/models/study.model');

// Mock Database và Model
jest.mock('../../src/config/database', () => ({
  execute: jest.fn()
}));
jest.mock('../../src/models/study.model');

describe('Study Service - Test Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('TC-09: Chấm điểm chính xác dựa trên các đáp án đã lưu nháp', async () => {
    const userId = 1;
    const attemptId = 100;

    // 1. Vượt qua cửa ải kiểm tra bài thi tồn tại
    db.execute.mockResolvedValueOnce([[{ id: attemptId, status: 'IN_PROGRESS' }]]);

    // 2. Cấp dữ liệu điểm cho StudyModel: 1 câu đúng, 1 câu sai
    StudyModel.getQuestionsForGrading.mockResolvedValueOnce([
      { id: 1, selected_option_id: 10, correct_option_id: 10, explanation: '', content: '' }, // Đúng
      { id: 2, selected_option_id: 11, correct_option_id: 12, explanation: '', content: '' }  // Sai
    ]);

    // 3. Cho hàm update chạy qua êm xuôi
    StudyModel.updateTestScore.mockResolvedValueOnce(true);

    const result = await studyService.submitTest(userId, attemptId);

    // Tính điểm: 1/2 câu = 50 điểm
    expect(result.correct_count).toBe(1);
    expect(result.total_questions).toBe(2);
    expect(result.score).toBe(50.0);

    // Xác nhận hàm lưu điểm đã được gọi đúng tham số
    expect(StudyModel.updateTestScore).toHaveBeenCalledWith(attemptId, 1, 50.0);
  });
});