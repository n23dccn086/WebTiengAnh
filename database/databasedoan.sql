-- ========================================== --
-- RESET DATABASE
-- ========================================== --

DROP DATABASE IF EXISTS edtech_db;

CREATE DATABASE edtech_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE edtech_db;

-- ========================================== --
-- PHÂN HỆ 1: AUTHENTICATION & RBAC
-- ========================================== --

CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roles (id, name, description) VALUES
(1, 'GUEST', 'Khách chưa đăng nhập'),
(2, 'USER', 'Người dùng thường'),
(3, 'PREMIUM', 'Người dùng trả phí'),
(4, 'ADMIN', 'Quản trị viên nội dung'),
(5, 'SUPER_ADMIN', 'Quản trị viên cao nhất');

CREATE TABLE permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO permissions (name, description) VALUES
('view_public_services', 'Xem dịch vụ công khai'),
('use_basic_quiz', 'Làm bài quiz cơ bản'),
('use_flashcard_srs', 'Học flashcard SRS'),
('use_ai_features', 'Dùng tính năng AI'),
('view_premium_explanation', 'Xem giải thích dành cho Premium'),
('manage_services', 'Quản lý dịch vụ'),
('manage_quizzes', 'Quản lý đề thi'),
('manage_flashcards', 'Quản lý flashcard'),
('manage_users', 'Quản lý người dùng'),
('manage_roles', 'Quản lý phân quyền'),
('manage_transactions', 'Quản lý giao dịch'),
('view_reports', 'Xem báo cáo hệ thống');

CREATE TABLE role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,

    PRIMARY KEY (role_id, permission_id),

    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- GUEST
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions
WHERE name IN ('view_public_services');

-- USER
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions
WHERE name IN (
    'view_public_services',
    'use_basic_quiz',
    'use_flashcard_srs'
);

-- PREMIUM
INSERT INTO role_permissions (role_id, permission_id)
SELECT 3, id FROM permissions
WHERE name IN (
    'view_public_services',
    'use_basic_quiz',
    'use_flashcard_srs',
    'use_ai_features',
    'view_premium_explanation'
);

-- ADMIN
INSERT INTO role_permissions (role_id, permission_id)
SELECT 4, id FROM permissions
WHERE name IN (
    'view_public_services',
    'use_basic_quiz',
    'use_flashcard_srs',
    'manage_services',
    'manage_quizzes',
    'manage_flashcards',
    'view_reports'
);

-- SUPER_ADMIN: có toàn bộ quyền
INSERT INTO role_permissions (role_id, permission_id)
SELECT 5, id FROM permissions;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,

    role_id INT NOT NULL DEFAULT 2,

    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,

    dob DATE NULL,
    phone VARCHAR(20) NULL,

    status ENUM('UNVERIFIED', 'ACTIVE', 'BANNED') DEFAULT 'UNVERIFIED',

    premium_until DATETIME NULL,
    ai_quota INT DEFAULT 0,
    is_reminder_enabled BOOLEAN DEFAULT TRUE,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_status ON users(status);

CREATE TABLE user_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    type ENUM('REFRESH_TOKEN', 'RESET_PASSWORD', 'VERIFY_EMAIL') NOT NULL,

    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_tokens_user_id ON user_tokens(user_id);
CREATE INDEX idx_user_tokens_token_type ON user_tokens(token, type);
CREATE INDEX idx_user_tokens_expires_at ON user_tokens(expires_at);

-- ========================================== --
-- PHÂN HỆ 2: SERVICES & QUIZ
-- ========================================== --

CREATE TABLE services (
    id INT AUTO_INCREMENT PRIMARY KEY,

    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('HIDDEN', 'VISIBLE') DEFAULT 'VISIBLE',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO services (id, title, description, status) VALUES
(1, 'Basic Vocabulary', 'Từ vựng tiếng Anh cơ bản', 'VISIBLE'),
(2, 'TOEIC', 'Luyện từ vựng và quiz TOEIC', 'VISIBLE'),
(3, 'IELTS', 'Luyện từ vựng và quiz IELTS', 'VISIBLE'),
(4, 'Grammar', 'Bài tập ngữ pháp tiếng Anh', 'VISIBLE');

CREATE TABLE quizzes (
    id INT AUTO_INCREMENT PRIMARY KEY,

    service_id INT NOT NULL,
    created_by INT NOT NULL,

    title VARCHAR(255) NOT NULL,
    is_ai_generated BOOLEAN DEFAULT FALSE,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (service_id) REFERENCES services(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX idx_quizzes_service_id ON quizzes(service_id);
CREATE INDEX idx_quizzes_created_by ON quizzes(created_by);

CREATE TABLE questions (
    id INT AUTO_INCREMENT PRIMARY KEY,

    quiz_id INT NOT NULL,
    content TEXT NOT NULL,

    level ENUM('EASY', 'MEDIUM', 'HARD') DEFAULT 'MEDIUM',
    explanation TEXT NULL,
    image_url VARCHAR(255) NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

CREATE INDEX idx_questions_quiz_id ON questions(quiz_id);

CREATE TABLE options (
    id INT AUTO_INCREMENT PRIMARY KEY,

    question_id INT NOT NULL,
    content TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE INDEX idx_options_question_id ON options(question_id);

-- ========================================== --
-- PHÂN HỆ 3: QUẢN LÝ LÀM BÀI & LƯU NHÁP
-- ========================================== --

CREATE TABLE quiz_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,
    quiz_id INT NOT NULL,

    score FLOAT DEFAULT 0,

    start_time DATETIME NOT NULL,
    end_time DATETIME NULL,

    status ENUM('IN_PROGRESS', 'SUBMITTED', 'TIMEOUT') DEFAULT 'IN_PROGRESS',

    last_saved_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_status ON quiz_attempts(status);
CREATE INDEX idx_quiz_attempts_last_saved_at ON quiz_attempts(last_saved_at);

CREATE TABLE user_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,

    attempt_id INT NOT NULL,
    question_id INT NOT NULL,
    selected_option_id INT NULL,

    is_correct BOOLEAN NOT NULL DEFAULT FALSE,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_attempt_question (attempt_id, question_id),

    FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (selected_option_id) REFERENCES options(id) ON DELETE SET NULL
);

CREATE INDEX idx_user_answers_attempt_id ON user_answers(attempt_id);
CREATE INDEX idx_user_answers_question_id ON user_answers(question_id);

-- ========================================== --
-- PHÂN HỆ 4: TỪ VỰNG SRS & THÔNG BÁO
-- ========================================== --

CREATE TABLE flashcards (
    id INT AUTO_INCREMENT PRIMARY KEY,

    service_id INT NOT NULL,
    created_by INT NULL,

    word VARCHAR(255) NOT NULL,
    meaning VARCHAR(255) NOT NULL,
    pronunciation VARCHAR(255),
    example_sentence TEXT,
    part_of_speech VARCHAR(50),

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (service_id) REFERENCES services(id),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_flashcards_service_id ON flashcards(service_id);
CREATE INDEX idx_flashcards_created_by ON flashcards(created_by);
CREATE INDEX idx_flashcards_word ON flashcards(word);

INSERT INTO flashcards
(service_id, created_by, word, meaning, pronunciation, example_sentence, part_of_speech)
VALUES
(1, NULL, 'Dog', 'Con chó', '/dɒɡ/', 'I have a dog.', 'noun'),
(1, NULL, 'Cat', 'Con mèo', '/kæt/', 'The cat is sleeping.', 'noun'),
(1, NULL, 'Study', 'Học tập', '/ˈstʌdi/', 'I study English every day.', 'verb'),
(2, NULL, 'Invoice', 'Hóa đơn', '/ˈɪnvɔɪs/', 'Please send me the invoice.', 'noun'),
(2, NULL, 'Meeting', 'Cuộc họp', '/ˈmiːtɪŋ/', 'We have a meeting at 9 AM.', 'noun'),
(3, NULL, 'Analyze', 'Phân tích', '/ˈænəlaɪz/', 'We need to analyze this chart.', 'verb'),
(3, NULL, 'Significant', 'Quan trọng, đáng kể', '/sɪɡˈnɪfɪkənt/', 'There was a significant increase.', 'adjective');

CREATE TABLE user_flashcards (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,
    flashcard_id INT NOT NULL,

    status ENUM('NEW', 'LEARNING', 'REVIEW') DEFAULT 'NEW',

    repetition_count INT DEFAULT 0,
    ease_factor FLOAT DEFAULT 2.5,
    interval_days INT DEFAULT 0,

    next_review_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_reviewed_at DATETIME NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_user_flashcard (user_id, flashcard_id),

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (flashcard_id) REFERENCES flashcards(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_flashcards_user_id ON user_flashcards(user_id);
CREATE INDEX idx_user_flashcards_flashcard_id ON user_flashcards(flashcard_id);
CREATE INDEX idx_user_flashcards_next_review_date ON user_flashcards(next_review_date);
CREATE INDEX idx_user_flashcards_status ON user_flashcards(status);

CREATE TABLE notification_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    type ENUM('SRS_REMINDER', 'PROMO', 'SYSTEM') NOT NULL,
    status ENUM('SENT', 'FAILED') DEFAULT 'SENT',

    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX idx_notification_logs_type ON notification_logs(type);
CREATE INDEX idx_notification_logs_status ON notification_logs(status);

-- ========================================== --
-- PHÂN HỆ 5: THANH TOÁN
-- ========================================== --

CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    amount INT NOT NULL,
    provider VARCHAR(50) NOT NULL,
    status ENUM('PENDING', 'SUCCESS', 'FAILED', 'CANCELED') DEFAULT 'PENDING',

    transaction_ref VARCHAR(255) UNIQUE NOT NULL,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_transaction_ref ON transactions(transaction_ref);

-- ========================================== --
-- HOÀN TẤT
-- ========================================== --

SELECT 'DATABASE edtech_db CREATED SUCCESSFULLY' AS message;