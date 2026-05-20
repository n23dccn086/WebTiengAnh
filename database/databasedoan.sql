-- ==========================================
-- KHỞI TẠO DATABASE
-- ==========================================
DROP DATABASE IF EXISTS edtech_db;

CREATE DATABASE edtech_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE edtech_db;
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
-- ==========================================
-- PHÂN HỆ 1: AUTHENTICATION & RBAC
-- ==========================================

CREATE TABLE roles (
    id   INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE permissions (
    id   INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE role_permissions (
    role_id       INT NOT NULL,
    permission_id INT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id)       REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

CREATE TABLE users (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    role_id             INT          NOT NULL,
    email               VARCHAR(255) UNIQUE NOT NULL,
    password_hash       VARCHAR(255) NOT NULL,
    full_name           VARCHAR(255) NOT NULL,
    dob                 DATE,
    phone               VARCHAR(20),
    status              ENUM('UNVERIFIED', 'ACTIVE', 'BANNED') DEFAULT 'UNVERIFIED',
    premium_until       DATETIME     NULL,
    ai_quota            INT          DEFAULT 0,
    quota_reset_at      DATE         DEFAULT (CURRENT_DATE),
    current_streak      INT          DEFAULT 0,
    last_active_date    DATE         NULL,
    is_reminder_enabled BOOLEAN      DEFAULT TRUE,
    created_at          DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE user_tokens (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT          NOT NULL,
    token      VARCHAR(512) NOT NULL,
    type       ENUM('REFRESH_TOKEN', 'RESET_PASSWORD', 'VERIFY_EMAIL') NOT NULL,
    expires_at DATETIME     NOT NULL,
    created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==========================================
-- PHÂN HỆ 2: SERVICES (Danh mục)
-- ==========================================
CREATE TABLE services (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    status      ENUM('HIDDEN', 'VISIBLE') DEFAULT 'VISIBLE',
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- PHÂN HỆ 3: QUẢN LÝ TÀI LIỆU (PDF UPLOAD)
-- ==========================================
CREATE TABLE documents (
    id                    INT AUTO_INCREMENT PRIMARY KEY,
    user_id               INT          NOT NULL,
    file_name             VARCHAR(255) NOT NULL,
    file_url              VARCHAR(512) NOT NULL,
    page_count            INT          NULL,
    total_words_extracted INT          DEFAULT 0,
    status                ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED') DEFAULT 'PENDING',
    created_at            DATETIME     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==========================================
-- PHÂN HỆ 4: BỘ FLASHCARD & FLASHCARD 
-- ==========================================
CREATE TABLE flashcard_sets (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    user_id          INT          NOT NULL,
    service_id       INT          NOT NULL,
    document_id      INT          NULL,
    title            VARCHAR(255) NOT NULL,
    description      TEXT         NULL,
    is_system        BOOLEAN      DEFAULT FALSE,
    created_at       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id)  REFERENCES services(id),
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE SET NULL
);

CREATE TABLE flashcards (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    set_id           INT          NOT NULL,
    word             VARCHAR(255) NOT NULL,
    meaning          VARCHAR(255) NOT NULL,
    pronunciation    VARCHAR(255) NULL,
    example_sentence TEXT         NULL,
    part_of_speech   VARCHAR(50)  NULL,
    created_at       DATETIME     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (set_id) REFERENCES flashcard_sets(id) ON DELETE CASCADE
);

CREATE TABLE user_saved_sets (
    user_id          INT NOT NULL,
    set_id           INT NOT NULL,
    is_srs_enabled   BOOLEAN DEFAULT FALSE,
    daily_new_words  INT DEFAULT 20,
    saved_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, set_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (set_id) REFERENCES flashcard_sets(id) ON DELETE CASCADE,
    INDEX idx_user_sets (user_id)
);

CREATE TABLE user_flashcards (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    user_id          INT   NOT NULL,
    flashcard_id     INT   NOT NULL,
    status           ENUM('NEW', 'LEARNING', 'REVIEW') DEFAULT 'NEW',
    repetition_count INT   DEFAULT 0,
    ease_factor      FLOAT DEFAULT 2.5,
    interval_days    INT   DEFAULT 0,
    next_review_date DATETIME NOT NULL,
    last_reviewed_at DATETIME NULL,
    UNIQUE KEY uq_user_flashcard (user_id, flashcard_id),
    FOREIGN KEY (user_id)      REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (flashcard_id) REFERENCES flashcards(id) ON DELETE CASCADE,
    INDEX idx_user_review (user_id, next_review_date)
);

-- ==========================================
-- PHÂN HỆ 5: TEST (Kiểm tra)
-- ==========================================
CREATE TABLE test_attempts (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT  NOT NULL,
    set_id          INT  NOT NULL,
    status          ENUM('IN_PROGRESS', 'COMPLETED') DEFAULT 'IN_PROGRESS',
    score           FLOAT NULL,
    total_questions INT DEFAULT 0,
    correct_count   INT DEFAULT 0,
    started_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at    DATETIME NULL,
    last_saved_at   DATETIME NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (set_id)  REFERENCES flashcard_sets(id) ON DELETE CASCADE
);

CREATE TABLE test_questions (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id    INT  NOT NULL,
    flashcard_id  INT  NOT NULL,
    content       TEXT NOT NULL,
    explanation   TEXT NULL,
    question_type ENUM('MEANING_TO_WORD', 'WORD_TO_MEANING', 'FILL_IN_BLANK') NOT NULL,
    order_index   INT  NOT NULL,
    FOREIGN KEY (attempt_id)   REFERENCES test_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (flashcard_id) REFERENCES flashcards(id) ON DELETE CASCADE
);

CREATE TABLE test_options (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT  NOT NULL,
    content     TEXT NOT NULL,
    is_correct  BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (question_id) REFERENCES test_questions(id) ON DELETE CASCADE
);

CREATE TABLE test_answers (
    id                 INT      AUTO_INCREMENT PRIMARY KEY,
    attempt_id         INT      NOT NULL,
    question_id        INT      NOT NULL,
    selected_option_id INT      NULL,
    is_correct         BOOLEAN  NULL,
    answered_at        DATETIME NULL,
    UNIQUE KEY uq_attempt_question (attempt_id, question_id),
    FOREIGN KEY (attempt_id)         REFERENCES test_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id)        REFERENCES test_questions(id) ON DELETE CASCADE,
    FOREIGN KEY (selected_option_id) REFERENCES test_options(id) ON DELETE SET NULL
);

-- ==========================================
-- PHÂN HỆ 6: THÔNG BÁO
-- ==========================================
CREATE TABLE notification_logs (
    id      INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type    ENUM('SRS_REMINDER', 'PROMO', 'SYSTEM') NOT NULL,
    status  ENUM('SENT', 'FAILED') DEFAULT 'SENT',
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==========================================
-- PHÂN HỆ 7: THANH TOÁN
-- ==========================================
CREATE TABLE transactions (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT          NOT NULL,
    amount          INT          NOT NULL,
    provider        ENUM('MOMO', 'VNPAY') NOT NULL,
    status          ENUM('PENDING', 'SUCCESS', 'FAILED', 'CANCELED') DEFAULT 'PENDING',
    transaction_ref VARCHAR(255) UNIQUE NOT NULL,
    created_at      DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==========================================
-- SEED DATA: ROLES, PERMISSIONS, SERVICES
-- ==========================================
INSERT INTO roles (name) VALUES
('GUEST'), ('USER'), ('PREMIUM'), ('ADMIN'), ('SUPER_ADMIN');

INSERT INTO permissions (name) VALUES
('manage_users'),
('manage_admins'),
('manage_flashcards'),
('manage_services'),
('view_explanation'),
('upload_pdf'),
('view_statistics');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'SUPER_ADMIN';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
JOIN permissions p ON p.name IN (
    'manage_users', 'manage_flashcards', 'manage_services'
)
WHERE r.name = 'ADMIN';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
JOIN permissions p ON p.name IN (
    'view_explanation', 'upload_pdf', 'view_statistics'
)
WHERE r.name = 'PREMIUM';

INSERT INTO services (id, title, description, status) VALUES
(1, 'Từ vựng cơ bản',   'Các từ thông dụng hàng ngày cho người mới bắt đầu', 'VISIBLE'),
(2, 'TOEIC',            'Luyện từ vựng và ngữ pháp theo chuẩn TOEIC', 'VISIBLE'),
(3, 'IELTS',            'Từ vựng học thuật và kỹ năng làm bài IELTS', 'VISIBLE'),
(4, 'Grammar',          'Bài tập ngữ pháp tiếng Anh từ cơ bản đến nâng cao', 'VISIBLE'),
(5, 'Từ vựng nâng cao', 'Từ học thuật và chuyên ngành', 'VISIBLE'),
(6, 'Tài liệu cá nhân', 'Từ vựng trích xuất từ PDF của bạn', 'VISIBLE');

-- ==========================================
-- TẠO USER MẶC ĐỊNH (ĐỂ THAM CHIẾU KHÓA NGOẠI)
-- ==========================================
-- Mật khẩu: Admin@123 (đã mã hóa bcrypt)
INSERT INTO users (role_id, email, password_hash, full_name, status, created_at) VALUES
(4, 'admin@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqjIq4T4jIq4T4jIq4T4jIq4T4jI', 'Admin', 'ACTIVE', NOW()),
(2, 'user@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqjIq4T4jIq4T4jIq4T4jIq4T4jI', 'Demo User', 'ACTIVE', NOW());
-- Admin sẽ có id=1, User demo id=2

-- ==============================================
-- BỔ SUNG: BẢNG ĐỀ THI TĨNH (STATIC QUIZZES)
-- ==============================================
CREATE TABLE IF NOT EXISTS static_quizzes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    service_id INT,
    is_system BOOLEAN DEFAULT TRUE,
    total_questions INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS static_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    content TEXT NOT NULL,
    question_type ENUM('MULTIPLE_CHOICE', 'TRUE_FALSE') DEFAULT 'MULTIPLE_CHOICE',
    explanation TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES static_quizzes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS static_options (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    content TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (question_id) REFERENCES static_questions(id) ON DELETE CASCADE
);

-- Bảng lưu kết quả làm bài của user trên bộ đề tĩnh
CREATE TABLE IF NOT EXISTS user_quiz_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    quiz_id INT NOT NULL,
    score FLOAT DEFAULT 0,
    total_questions INT DEFAULT 0,
    correct_count INT DEFAULT 0,
    status ENUM('IN_PROGRESS', 'COMPLETED') DEFAULT 'IN_PROGRESS',
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME NULL,
    last_saved_at DATETIME NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (quiz_id) REFERENCES static_quizzes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_quiz_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL,
    question_id INT NOT NULL,
    selected_option_id INT NULL,
    is_correct BOOLEAN NULL,
    answered_at DATETIME NULL,
    UNIQUE KEY uq_attempt_question (attempt_id, question_id),
    FOREIGN KEY (attempt_id) REFERENCES user_quiz_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES static_questions(id) ON DELETE CASCADE,
    FOREIGN KEY (selected_option_id) REFERENCES static_options(id) ON DELETE SET NULL
);

-- ==============================================
-- SEED DỮ LIỆU: BỘ ĐỀ MẪU (TOEIC, IELTS, GRAMMAR)
-- ==============================================

-- 1. Bộ đề TOEIC (service_id = 2) với 20 câu hỏi
INSERT INTO static_quizzes (title, description, service_id, total_questions) VALUES
('TOEIC Vocabulary Test 1', '20 câu từ vựng TOEIC cơ bản', 2, 20);
SET @toeic_quiz = LAST_INSERT_ID();

-- Câu 1-20 (đầy đủ)
INSERT INTO static_questions (quiz_id, content, explanation) VALUES (@toeic_quiz, 'The word "invoice" is closest in meaning to _____.', 'Hóa đơn, biên nhận');
SET @q1 = LAST_INSERT_ID();
INSERT INTO static_options (question_id, content, is_correct) VALUES
(@q1, 'Receipt', TRUE), (@q1, 'Order', FALSE), (@q1, 'Payment', FALSE), (@q1, 'Contract', FALSE);

INSERT INTO static_questions (quiz_id, content, explanation) VALUES (@toeic_quiz, 'Please _____ the report before submitting it to the manager.', 'Xem xét, kiểm tra');
SET @q2 = LAST_INSERT_ID();
INSERT INTO static_options (question_id, content, is_correct) VALUES
(@q2, 'review', TRUE), (@q2, 'revise', FALSE), (@q2, 'rewrite', FALSE), (@q2, 'return', FALSE);

INSERT INTO static_questions (quiz_id, content, explanation) VALUES (@toeic_quiz, 'The meeting was _____ due to the CEO''s illness.', 'Hoãn lại');
SET @q3 = LAST_INSERT_ID();
INSERT INTO static_options (question_id, content, is_correct) VALUES
(@q3, 'postponed', TRUE), (@q3, 'canceled', FALSE), (@q3, 'advanced', FALSE), (@q3, 'shortened', FALSE);

INSERT INTO static_questions (quiz_id, content, explanation) VALUES (@toeic_quiz, 'She is responsible _____ customer service.', 'Chịu trách nhiệm về');
SET @q4 = LAST_INSERT_ID();
INSERT INTO static_options (question_id, content, is_correct) VALUES
(@q4, 'for', TRUE), (@q4, 'to', FALSE), (@q4, 'with', FALSE), (@q4, 'at', FALSE);

INSERT INTO static_questions (quiz_id, content, explanation) VALUES (@toeic_quiz, 'The company offers a wide _____ of products.', 'Nhiều loại, đa dạng');
SET @q5 = LAST_INSERT_ID();
INSERT INTO static_options (question_id, content, is_correct) VALUES
(@q5, 'variety', TRUE), (@q5, 'range', FALSE), (@q5, 'selection', FALSE), (@q5, 'both B and C', FALSE);

INSERT INTO static_questions (quiz_id, content, explanation) VALUES (@toeic_quiz, 'If you need any _____, please contact our support team.', 'Hỗ trợ, trợ giúp');
SET @q6 = LAST_INSERT_ID();
INSERT INTO static_options (question_id, content, is_correct) VALUES
(@q6, 'assistance', TRUE), (@q6, 'help', FALSE), (@q6, 'aid', FALSE), (@q6, 'all of the above', FALSE);

INSERT INTO static_questions (quiz_id, content, explanation) VALUES (@toeic_quiz, 'The new policy will take _____ next month.', 'Có hiệu lực');
SET @q7 = LAST_INSERT_ID();
INSERT INTO static_options (question_id, content, is_correct) VALUES
(@q7, 'effect', TRUE), (@q7, 'affect', FALSE), (@q7, 'place', FALSE), (@q7, 'part', FALSE);

INSERT INTO static_questions (quiz_id, content, explanation) VALUES (@toeic_quiz, 'He is _____ to succeed because he works hard.', 'Có khả năng');
SET @q8 = LAST_INSERT_ID();
INSERT INTO static_options (question_id, content, is_correct) VALUES
(@q8, 'likely', TRUE), (@q8, 'probably', FALSE), (@q8, 'maybe', FALSE), (@q8, 'possible', FALSE);

INSERT INTO static_questions (quiz_id, content, explanation) VALUES (@toeic_quiz, 'The report was _____ by the financial analyst.', 'Chuẩn bị, soạn thảo');
SET @q9 = LAST_INSERT_ID();
INSERT INTO static_options (question_id, content, is_correct) VALUES
(@q9, 'prepared', TRUE), (@q9, 'made', FALSE), (@q9, 'done', FALSE), (@q9, 'written', FALSE);

INSERT INTO static_questions (quiz_id, content, explanation) VALUES (@toeic_quiz, 'Despite the bad weather, the flight _____ on time.', 'Khởi hành');
SET @q10 = LAST_INSERT_ID();
INSERT INTO static_options (question_id, content, is_correct) VALUES
(@q10, 'departed', TRUE), (@q10, 'arrived', FALSE), (@q10, 'landed', FALSE), (@q10, 'took off', FALSE);

INSERT INTO static_questions (quiz_id, content, explanation) VALUES (@toeic_quiz, 'Please make sure to _____ the documents before the deadline.', 'Nộp, gửi');
SET @q11 = LAST_INSERT_ID();
INSERT INTO static_options (question_id, content, is_correct) VALUES
(@q11, 'submit', TRUE), (@q11, 'send', FALSE), (@q11, 'deliver', FALSE), (@q11, 'forward', FALSE);

INSERT INTO static_questions (quiz_id, content, explanation) VALUES (@toeic_quiz, 'The CEO will _____ a speech at the annual conference.', 'Đưa ra (bài diễn văn)');
SET @q12 = LAST_INSERT_ID();
INSERT INTO static_options (question_id, content, is_correct) VALUES
(@q12, 'deliver', TRUE), (@q12, 'talk', FALSE), (@q12, 'say', FALSE), (@q12, 'speak', FALSE);

INSERT INTO static_questions (quiz_id, content, explanation) VALUES (@toeic_quiz, 'Our team _____ the project successfully last month.', 'Hoàn thành');
SET @q13 = LAST_INSERT_ID();
INSERT INTO static_options (question_id, content, is_correct) VALUES
(@q13, 'completed', TRUE), (@q13, 'finished', FALSE), (@q13, 'ended', FALSE), (@q13, 'closed', FALSE);

INSERT INTO static_questions (quiz_id, content, explanation) VALUES (@toeic_quiz, 'The training session will be held _____ 9 AM and 5 PM.', 'Giữa');
SET @q14 = LAST_INSERT_ID();
INSERT INTO static_options (question_id, content, is_correct) VALUES
(@q14, 'between', TRUE), (@q14, 'from', FALSE), (@q14, 'at', FALSE), (@q14, 'during', FALSE);

INSERT INTO static_questions (quiz_id, content, explanation) VALUES (@toeic_quiz, 'You are required to _____ a valid ID to enter the building.', 'Xuất trình');
SET @q15 = LAST_INSERT_ID();
INSERT INTO static_options (question_id, content, is_correct) VALUES
(@q15, 'present', TRUE), (@q15, 'show', FALSE), (@q15, 'provide', FALSE), (@q15, 'give', FALSE);

INSERT INTO static_questions (quiz_id, content, explanation) VALUES (@toeic_quiz, 'The product was _____ due to low demand.', 'Ngừng sản xuất');
SET @q16 = LAST_INSERT_ID();
INSERT INTO static_options (question_id, content, is_correct) VALUES
(@q16, 'discontinued', TRUE), (@q16, 'stopped', FALSE), (@q16, 'ended', FALSE), (@q16, 'cancelled', FALSE);

INSERT INTO static_questions (quiz_id, content, explanation) VALUES (@toeic_quiz, 'Employees are encouraged to _____ their feedback.', 'Chia sẻ, cung cấp');
SET @q17 = LAST_INSERT_ID();
INSERT INTO static_options (question_id, content, is_correct) VALUES
(@q17, 'provide', TRUE), (@q17, 'give', FALSE), (@q17, 'offer', FALSE), (@q17, 'supply', FALSE);

INSERT INTO static_questions (quiz_id, content, explanation) VALUES (@toeic_quiz, 'The new software is _____ with most operating systems.', 'Tương thích');
SET @q18 = LAST_INSERT_ID();
INSERT INTO static_options (question_id, content, is_correct) VALUES
(@q18, 'compatible', TRUE), (@q18, 'consistent', FALSE), (@q18, 'suitable', FALSE), (@q18, 'agreeable', FALSE);

INSERT INTO static_questions (quiz_id, content, explanation) VALUES (@toeic_quiz, 'We regret to _____ you that your application has been rejected.', 'Thông báo (tin xấu)');
SET @q19 = LAST_INSERT_ID();
INSERT INTO static_options (question_id, content, is_correct) VALUES
(@q19, 'inform', TRUE), (@q19, 'notify', FALSE), (@q19, 'tell', FALSE), (@q19, 'announce', FALSE);

INSERT INTO static_questions (quiz_id, content, explanation) VALUES (@toeic_quiz, 'The company will _____ a new branch in Hanoi next year.', 'Mở, thành lập');
SET @q20 = LAST_INSERT_ID();
INSERT INTO static_options (question_id, content, is_correct) VALUES
(@q20, 'establish', TRUE), (@q20, 'open', FALSE), (@q20, 'build', FALSE), (@q20, 'create', FALSE);

-- 2. Bộ đề IELTS (service_id = 3) với 15 câu
INSERT INTO static_quizzes (title, description, service_id, total_questions) VALUES
('IELTS Reading Vocabulary 1', '15 từ vựng thường gặp trong IELTS Reading', 3, 15);
SET @ielts_quiz = LAST_INSERT_ID();

INSERT INTO static_questions (quiz_id, content, explanation) VALUES (@ielts_quiz, 'The word "significant" is closest in meaning to _____.', 'Quan trọng, đáng kể');
SET @iq1 = LAST_INSERT_ID();
INSERT INTO static_options (question_id, content, is_correct) VALUES
(@iq1, 'important', TRUE), (@iq1, 'small', FALSE), (@iq1, 'negligible', FALSE), (@iq1, 'usual', FALSE);

INSERT INTO static_questions (quiz_id, content, explanation) VALUES (@ielts_quiz, 'What is the meaning of "analyze"?', 'Phân tích');
SET @iq2 = LAST_INSERT_ID();
INSERT INTO static_options (question_id, content, is_correct) VALUES
(@iq2, 'to examine in detail', TRUE), (@iq2, 'to ignore', FALSE), (@iq2, 'to guess', FALSE), (@iq2, 'to summarize', FALSE);

INSERT INTO static_questions (quiz_id, content, explanation) VALUES (@ielts_quiz, 'The project was a _____ success.', 'Lớn, to lớn');
SET @iq3 = LAST_INSERT_ID();
INSERT INTO static_options (question_id, content, is_correct) VALUES
(@iq3, 'tremendous', TRUE), (@iq3, 'tiny', FALSE), (@iq3, 'slight', FALSE), (@iq3, 'minor', FALSE);

INSERT INTO static_questions (quiz_id, content, explanation) VALUES (@ielts_quiz, 'What does "consequence" mean?', 'Hậu quả, kết quả');
SET @iq4 = LAST_INSERT_ID();
INSERT INTO static_options (question_id, content, is_correct) VALUES
(@iq4, 'result', TRUE), (@iq4, 'cause', FALSE), (@iq4, 'process', FALSE), (@iq4, 'beginning', FALSE);

INSERT INTO static_questions (quiz_id, content, explanation) VALUES (@ielts_quiz, 'The word "contribute" is closest to _____.', 'Đóng góp');
SET @iq5 = LAST_INSERT_ID();
INSERT INTO static_options (question_id, content, is_correct) VALUES
(@iq5, 'give', TRUE), (@iq5, 'take', FALSE), (@iq5, 'receive', FALSE), (@iq5, 'spend', FALSE);

INSERT INTO static_questions (quiz_id, content, explanation) VALUES (@ielts_quiz, 'What is a "debate"?', 'Cuộc tranh luận');
SET @iq6 = LAST_INSERT_ID();
INSERT INTO static_options (question_id, content, is_correct) VALUES
(@iq6, 'discussion', TRUE), (@iq6, 'speech', FALSE), (@iq6, 'lecture', FALSE), (@iq6, 'summary', FALSE);

INSERT INTO static_questions (quiz_id, content, explanation) VALUES (@ielts_quiz, 'The word "environment" refers to _____.', 'Môi trường');
SET @iq7 = LAST_INSERT_ID();
INSERT INTO static_options (question_id, content, is_correct) VALUES
(@iq7, 'surroundings', TRUE), (@iq7, 'climate', FALSE), (@iq7, 'ecosystem', FALSE), (@iq7, 'atmosphere', FALSE);

INSERT INTO static_questions (quiz_id, content, explanation) VALUES (@ielts_quiz, 'What is the meaning of "flexible"?', 'Linh hoạt');
SET @iq8 = LAST_INSERT_ID();
INSERT INTO static_options (question_id, content, is_correct) VALUES
(@iq8, 'adaptable', TRUE), (@iq8, 'rigid', FALSE), (@iq8, 'strong', FALSE), (@iq8, 'weak', FALSE);

INSERT INTO static_questions (quiz_id, content, explanation) VALUES (@ielts_quiz, 'The word "obvious" is best defined as _____.', 'Rõ ràng');
SET @iq9 = LAST_INSERT_ID();
INSERT INTO static_options (question_id, content, is_correct) VALUES
(@iq9, 'clear', TRUE), (@iq9, 'hidden', FALSE), (@iq9, 'complex', FALSE), (@iq9, 'simple', FALSE);

INSERT INTO static_questions (quiz_id, content, explanation) VALUES (@ielts_quiz, 'What does "predict" mean?', 'Dự đoán');
SET @iq10 = LAST_INSERT_ID();
INSERT INTO static_options (question_id, content, is_correct) VALUES
(@iq10, 'forecast', TRUE), (@iq10, 'retrospect', FALSE), (@iq10, 'remember', FALSE), (@iq10, 'ignore', FALSE);

INSERT INTO static_questions (quiz_id, content, explanation) VALUES (@ielts_quiz, 'The word "evidence" is most similar to _____.', 'Bằng chứng');
SET @iq11 = LAST_INSERT_ID();
INSERT INTO static_options (question_id, content, is_correct) VALUES
(@iq11, 'proof', TRUE), (@iq11, 'theory', FALSE), (@iq11, 'guess', FALSE), (@iq11, 'assumption', FALSE);

INSERT INTO static_questions (quiz_id, content, explanation) VALUES (@ielts_quiz, 'What is the meaning of "individual"?', 'Cá nhân');
SET @iq12 = LAST_INSERT_ID();
INSERT INTO static_options (question_id, content, is_correct) VALUES
(@iq12, 'person', TRUE), (@iq12, 'group', FALSE), (@iq12, 'organization', FALSE), (@iq12, 'community', FALSE);

INSERT INTO static_questions (quiz_id, content, explanation) VALUES (@ielts_quiz, 'The word "perceive" is closest to _____.', 'Nhận thức');
SET @iq13 = LAST_INSERT_ID();
INSERT INTO static_options (question_id, content, is_correct) VALUES
(@iq13, 'see', TRUE), (@iq13, 'hear', FALSE), (@iq13, 'touch', FALSE), (@iq13, 'smell', FALSE);

INSERT INTO static_questions (quiz_id, content, explanation) VALUES (@ielts_quiz, 'What does "range" mean in "a wide range of options"?', 'Phạm vi, loạt');
SET @iq14 = LAST_INSERT_ID();
INSERT INTO static_options (question_id, content, is_correct) VALUES
(@iq14, 'variety', TRUE), (@iq14, 'limit', FALSE), (@iq14, 'distance', FALSE), (@iq14, 'mountain', FALSE);

INSERT INTO static_questions (quiz_id, content, explanation) VALUES (@ielts_quiz, 'The word "strategy" refers to _____.', 'Chiến lược');
SET @iq15 = LAST_INSERT_ID();
INSERT INTO static_options (question_id, content, is_correct) VALUES
(@iq15, 'plan', TRUE), (@iq15, 'goal', FALSE), (@iq15, 'result', FALSE), (@iq15, 'problem', FALSE);

-- 3. Bộ đề Grammar (service_id = 4) với 10 câu
INSERT INTO static_quizzes (title, description, service_id, total_questions) VALUES
('English Grammar - Present Tenses', '10 câu ngữ pháp thì hiện tại', 4, 10);
SET @grammar_quiz = LAST_INSERT_ID();

INSERT INTO static_questions (quiz_id, content, explanation) VALUES (@grammar_quiz, 'She _____ to work every day.', 'Thì hiện tại đơn – chủ ngữ số ít');
SET @gq1 = LAST_INSERT_ID();
INSERT INTO static_options (question_id, content, is_correct) VALUES
(@gq1, 'walks', TRUE), (@gq1, 'walk', FALSE), (@gq1, 'walking', FALSE), (@gq1, 'walked', FALSE);

INSERT INTO static_questions (quiz_id, content, explanation) VALUES (@grammar_quiz, 'They _____ watching TV now.', 'Hiện tại tiếp diễn');
SET @gq2 = LAST_INSERT_ID();
INSERT INTO static_options (question_id, content, is_correct) VALUES
(@gq2, 'are', TRUE), (@gq2, 'is', FALSE), (@gq2, 'am', FALSE), (@gq2, 'be', FALSE);

INSERT INTO static_questions (quiz_id, content, explanation) VALUES (@grammar_quiz, 'He usually _____ coffee in the morning.', 'Hiện tại đơn, thói quen');
SET @gq3 = LAST_INSERT_ID();
INSERT INTO static_options (question_id, content, is_correct) VALUES
(@gq3, 'drinks', TRUE), (@gq3, 'drink', FALSE), (@gq3, 'is drinking', FALSE), (@gq3, 'has drunk', FALSE);

INSERT INTO static_questions (quiz_id, content, explanation) VALUES (@grammar_quiz, 'Look! The sun _____.', 'Hiện tại tiếp diễn – hành động đang xảy ra');
SET @gq4 = LAST_INSERT_ID();
INSERT INTO static_options (question_id, content, is_correct) VALUES
(@gq4, 'is shining', TRUE), (@gq4, 'shines', FALSE), (@gq4, 'shone', FALSE), (@gq4, 'has shone', FALSE);

INSERT INTO static_questions (quiz_id, content, explanation) VALUES (@grammar_quiz, 'I _____ him for three years.', 'Hiện tại hoàn thành');
SET @gq5 = LAST_INSERT_ID();
INSERT INTO static_options (question_id, content, is_correct) VALUES
(@gq5, 'have known', TRUE), (@gq5, 'knew', FALSE), (@gq5, 'know', FALSE), (@gq5, 'am knowing', FALSE);

INSERT INTO static_questions (quiz_id, content, explanation) VALUES (@grammar_quiz, 'The train _____ at 7 PM tomorrow.', 'Thì hiện tại đơn diễn tả lịch trình');
SET @gq6 = LAST_INSERT_ID();
INSERT INTO static_options (question_id, content, is_correct) VALUES
(@gq6, 'leaves', TRUE), (@gq6, 'is leaving', FALSE), (@gq6, 'will leave', FALSE), (@gq6, 'left', FALSE);

INSERT INTO static_questions (quiz_id, content, explanation) VALUES (@grammar_quiz, 'She is a doctor. She _____ people.', 'Hiện tại đơn – nghề nghiệp');
SET @gq7 = LAST_INSERT_ID();
INSERT INTO static_options (question_id, content, is_correct) VALUES
(@gq7, 'helps', TRUE), (@gq7, 'help', FALSE), (@gq7, 'is helping', FALSE), (@gq7, 'has helped', FALSE);

INSERT INTO static_questions (quiz_id, content, explanation) VALUES (@grammar_quiz, 'How many times _____ you _____ to London?', 'Hiện tại hoàn thành – kinh nghiệm');
SET @gq8 = LAST_INSERT_ID();
INSERT INTO static_options (question_id, content, is_correct) VALUES
(@gq8, 'have ... been', TRUE), (@gq8, 'did ... go', FALSE), (@gq8, 'were ... going', FALSE), (@gq8, 'do ... go', FALSE);

INSERT INTO static_questions (quiz_id, content, explanation) VALUES (@grammar_quiz, 'Listen! Someone _____ the piano.', 'Hiện tại tiếp diễn – hành động đang diễn ra');
SET @gq9 = LAST_INSERT_ID();
INSERT INTO static_options (question_id, content, is_correct) VALUES
(@gq9, 'is playing', TRUE), (@gq9, 'plays', FALSE), (@gq9, 'has played', FALSE), (@gq9, 'played', FALSE);

INSERT INTO static_questions (quiz_id, content, explanation) VALUES (@grammar_quiz, 'We _____ to the cinema tonight.', 'Hiện tại tiếp diễn – kế hoạch tương lai gần');
SET @gq10 = LAST_INSERT_ID();
INSERT INTO static_options (question_id, content, is_correct) VALUES
(@gq10, 'are going', TRUE), (@gq10, 'go', FALSE), (@gq10, 'will go', FALSE), (@gq10, 'went', FALSE);

-- ==============================================
-- SEED FLASHCARD HỆ THỐNG (30 TỪ TOEIC)
-- ==============================================
INSERT INTO flashcard_sets (user_id, service_id, title, description, is_system) VALUES
(1, 2, 'TOEIC Flashcard Set 1', '30 từ vựng TOEIC kèm nghĩa và ví dụ', TRUE);
SET @flashcard_set = LAST_INSERT_ID();

INSERT INTO flashcards (set_id, word, meaning, pronunciation, example_sentence, part_of_speech) VALUES
(@flashcard_set, 'invoice', 'hóa đơn', '/ˈɪn.vɔɪs/', 'Please send the invoice to our accounting department.', 'noun'),
(@flashcard_set, 'purchase', 'mua sắm', '/ˈpɜː.tʃəs/', 'We made a large purchase of office supplies.', 'noun/verb'),
(@flashcard_set, 'shipment', 'lô hàng', '/ˈʃɪp.mənt/', 'Your shipment will arrive tomorrow.', 'noun'),
(@flashcard_set, 'warranty', 'bảo hành', '/ˈwɒr.ən.ti/', 'The product comes with a 2-year warranty.', 'noun'),
(@flashcard_set, 'refund', 'hoàn tiền', '/ˈriː.fʌnd/', 'You can request a refund within 30 days.', 'noun/verb'),
(@flashcard_set, 'deadline', 'hạn chót', '/ˈded.laɪn/', 'The deadline for submission is Friday.', 'noun'),
(@flashcard_set, 'evaluate', 'đánh giá', '/ɪˈvæl.ju.eɪt/', 'We need to evaluate the candidates carefully.', 'verb'),
(@flashcard_set, 'negotiate', 'thương lượng', '/nɪˈɡəʊ.ʃi.eɪt/', 'They negotiated a better price.', 'verb'),
(@flashcard_set, 'contract', 'hợp đồng', '/ˈkɒn.trækt/', 'Both parties signed the contract.', 'noun'),
(@flashcard_set, 'significant', 'quan trọng', '/sɪɡˈnɪf.ɪ.kənt/', 'There has been a significant improvement.', 'adjective'),
(@flashcard_set, 'analyze', 'phân tích', '/ˈæn.əl.aɪz/', 'We need to analyze the sales data.', 'verb'),
(@flashcard_set, 'strategy', 'chiến lược', '/ˈstræt.ə.dʒi/', 'Our marketing strategy needs improvement.', 'noun'),
(@flashcard_set, 'competitive', 'cạnh tranh', '/kəmˈpet.ɪ.tɪv/', 'The market is highly competitive.', 'adjective'),
(@flashcard_set, 'potential', 'tiềm năng', '/pəˈten.ʃəl/', 'This idea has great potential.', 'noun'),
(@flashcard_set, 'liaise', 'liên lạc', '/liˈeɪz/', 'You will liaise with the client.', 'verb'),
(@flashcard_set, 'implement', 'thực hiện', '/ˈɪm.plɪ.ment/', 'We will implement the new policy.', 'verb'),
(@flashcard_set, 'supervise', 'giám sát', '/ˈsuː.pə.vaɪz/', 'She supervises a team of five.', 'verb'),
(@flashcard_set, 'delegate', 'ủy quyền', '/ˈdel.ɪ.ɡeɪt/', 'A good leader delegates tasks.', 'verb'),
(@flashcard_set, 'prioritize', 'ưu tiên', '/praɪˈɒr.ɪ.taɪz/', 'You need to prioritize your work.', 'verb'),
(@flashcard_set, 'efficient', 'hiệu quả', '/ɪˈfɪʃ.ənt/', 'This new method is more efficient.', 'adjective'),
(@flashcard_set, 'initiative', 'sáng kiến', '/ɪˈnɪʃ.ə.tɪv/', 'She took the initiative to start the project.', 'noun'),
(@flashcard_set, 'collaborate', 'hợp tác', '/kəˈlæb.ə.reɪt/', 'We collaborate with international partners.', 'verb'),
(@flashcard_set, 'flexible', 'linh hoạt', '/ˈflek.sə.bəl/', 'We offer flexible working hours.', 'adjective'),
(@flashcard_set, 'dedicated', 'tận tụy', '/ˈded.ɪ.keɪ.tɪd/', 'She is a dedicated employee.', 'adjective'),
(@flashcard_set, 'outcome', 'kết quả', '/ˈaʊt.kʌm/', 'The outcome of the meeting was positive.', 'noun'),
(@flashcard_set, 'milestone', 'cột mốc', '/ˈmaɪl.stəʊn/', 'This is a major milestone for us.', 'noun'),
(@flashcard_set, 'streamline', 'hợp lý hóa', '/ˈstriːm.laɪn/', 'We need to streamline the process.', 'verb'),
(@flashcard_set, 'viable', 'khả thi', '/ˈvaɪ.ə.bəl/', 'Is this solution economically viable?', 'adjective'),
(@flashcard_set, 'scalable', 'có thể mở rộng', '/ˈskeɪ.lə.bəl/', 'Our platform is highly scalable.', 'adjective'),
(@flashcard_set, 'innovation', 'đổi mới', '/ˌɪn.əˈveɪ.ʃən/', 'Innovation drives growth.', 'noun');

-- Kết thúc