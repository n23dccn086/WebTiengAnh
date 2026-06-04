// File: tests/integration/quizFlow.test.js
const request = require('supertest');
const express = require('express');

// 1. MOCK MIDDLEWARE: Bỏ qua bước kiểm tra Token
jest.mock('../../src/middlewares/auth.middleware', () => ({
  protect: (req, res, next) => {
    req.user = { id: 1, role: 'USER' };
    next();
  }
}));

// 2. MOCK SERVICE: Sửa lại đúng tên hàm `saveProgress` và trả về đúng format dữ liệu
jest.mock('../../src/services/study.service', () => ({
  createTest: jest.fn().mockResolvedValue({
    attempt_id: 999,
    is_resume: false,
    message: 'Tạo bài thi mới thành công',
    questions: []
  }),
  saveProgress: jest.fn().mockResolvedValue({ saved_count: 1 }), // Đã sửa tên hàm ở đây
  submitTest: jest.fn().mockResolvedValue({
    score: 8.5,
    correct_count: 8,
    total_questions: 10
  })
}));

const studyRoutes = require('../../src/routes/v1/study.route');

const app = express();
app.use(express.json());
app.use('/api/v1/study', studyRoutes);

describe('Kiểm thử tích hợp (Integration Test) - Luồng Quiz Flow', () => {
  let attemptId = 999;

  test('Bước 1: POST /api/v1/study/:setId/test - Tạo bài thi mới', async () => {
    const response = await request(app)
      .post('/api/v1/study/1/test')
      .send({ num_questions: 10 }); 

    expect(response.status).toBe(201);
    expect(response.body.status).toBe('success');
    expect(response.body.data.attempt_id).toBe(999); // Sửa lại thành attempt_id cho khớp service
  });

  test('Bước 2: PATCH /api/v1/study/tests/:attemptId/auto-save - Lưu nháp tiến độ', async () => {
    const response = await request(app)
      .patch(`/api/v1/study/tests/${attemptId}/auto-save`)
      .send({
        answers: [
          { question_id: 101, selected_option_id: 5 }
        ]
      });

    expect(response.status).toBe(200);
    // Sửa lại cho khớp với successResponse trong controller
    expect(response.body.message).toBe('Đã lưu nháp tiến độ');
  });

  test('Bước 3: POST /api/v1/study/tests/:attemptId/submit - Nộp bài và xem điểm', async () => {
    const response = await request(app)
      .post(`/api/v1/study/tests/${attemptId}/submit`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Nộp bài thành công');
    expect(response.body.data.score).toBe(8.5); 
  });
});