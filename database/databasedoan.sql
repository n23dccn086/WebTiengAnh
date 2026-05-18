-- ==========================================
-- KHỞI TẠO DATABASE
-- ==========================================
DROP DATABASE IF EXISTS edtech_db;

CREATE DATABASE edtech_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE edtech_db;

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
    FOREIGN KEY (role_id)       REFERENCES roles(id)       ON DELETE CASCADE,
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
    FOREIGN KEY (user_id)     REFERENCES users(id)      ON DELETE CASCADE,
    FOREIGN KEY (service_id)  REFERENCES services(id),
    FOREIGN KEY (document_id) REFERENCES documents(id)  ON DELETE SET NULL
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
    FOREIGN KEY (user_id)      REFERENCES users(id)      ON DELETE CASCADE,
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
    FOREIGN KEY (user_id) REFERENCES users(id)         ON DELETE CASCADE,
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
    FOREIGN KEY (flashcard_id) REFERENCES flashcards(id)    ON DELETE CASCADE
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
    FOREIGN KEY (attempt_id)         REFERENCES test_attempts(id)  ON DELETE CASCADE,
    FOREIGN KEY (question_id)        REFERENCES test_questions(id) ON DELETE CASCADE,
    FOREIGN KEY (selected_option_id) REFERENCES test_options(id)   ON DELETE SET NULL
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
-- SEED DATA
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

INSERT INTO services (title, description) VALUES
('Từ vựng cơ bản',   'Các từ thông dụng hàng ngày cho người mới bắt đầu'),
('Từ vựng nâng cao', 'Từ học thuật và chuyên ngành'),
('Tài liệu cá nhân', 'Từ vựng trích xuất từ PDF của bạn');