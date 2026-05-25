-- ==========================================
-- KHỞI TẠO DATABASE (XÓA SẠCH XÂY LẠI)
-- ==========================================
DROP DATABASE IF EXISTS edtech_db;

CREATE DATABASE edtech_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE edtech_db;
SET SQL_SAFE_UPDATES = 0;
SET NAMES utf8mb4;

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
    id          INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT          NOT NULL,
    service_id  INT          NOT NULL,
    document_id INT          NULL,
    title       VARCHAR(255) NOT NULL,
    description TEXT         NULL,
    is_system   BOOLEAN      DEFAULT FALSE,
    created_at  DATETIME     DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE CASCADE,
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
    user_id         INT NOT NULL,
    set_id          INT NOT NULL,
    is_srs_enabled  BOOLEAN DEFAULT FALSE,
    daily_new_words INT DEFAULT 20,
    saved_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, set_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (set_id)  REFERENCES flashcard_sets(id) ON DELETE CASCADE,
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
-- PHÂN HỆ 5: TEST ĐỘNG (Dynamic Quizzes)
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
-- PHÂN HỆ 6: THÔNG BÁO & THANH TOÁN
-- ==========================================
CREATE TABLE notification_logs (
    id      INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type    ENUM('SRS_REMINDER', 'PROMO', 'SYSTEM') NOT NULL,
    status  ENUM('SENT', 'FAILED') DEFAULT 'SENT',
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

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
-- SEED DATA: HỆ THỐNG VÀ ROLES
-- ==========================================
INSERT INTO roles (name) VALUES 
('GUEST'), ('USER'), ('PREMIUM'), ('ADMIN'), ('SUPER_ADMIN');

INSERT INTO permissions (name) VALUES 
('manage_users'), ('manage_admins'), ('manage_flashcards'), 
('manage_services'), ('view_explanation'), ('upload_pdf'), ('view_statistics');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'SUPER_ADMIN';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
JOIN permissions p ON p.name IN ('manage_users', 'manage_flashcards', 'manage_services')
WHERE r.name = 'ADMIN';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
JOIN permissions p ON p.name IN ('view_explanation', 'upload_pdf', 'view_statistics')
WHERE r.name = 'PREMIUM';

INSERT INTO services (id, title, description, status) VALUES 
(1, 'Từ vựng cơ bản', 'Các từ thông dụng hàng ngày cho người mới bắt đầu', 'VISIBLE'),
(2, 'TOEIC', 'Luyện từ vựng và ngữ pháp theo chuẩn TOEIC', 'VISIBLE'),
(3, 'IELTS', 'Từ vựng học thuật và kỹ năng làm bài IELTS', 'VISIBLE'),
(4, 'Grammar', 'Bài tập ngữ pháp tiếng Anh từ cơ bản đến nâng cao', 'VISIBLE'),
(5, 'Từ vựng nâng cao', 'Từ học thuật và chuyên ngành', 'VISIBLE'),
(6, 'Tài liệu cá nhân', 'Từ vựng trích xuất từ PDF của bạn', 'VISIBLE');

-- ==========================================
-- SEED DATA: USERS (DEMO & SYSTEM)
-- ==========================================
INSERT INTO users (role_id, email, password_hash, full_name, status, ai_quota) VALUES
((SELECT id FROM roles WHERE name = 'USER'), 'vohoang131005@gmail.com', '$2b$10$mcBXFBR84h4mBB7rtNdJHunKCLsaNLBmz.iwHaFR6xG59UsVubDNa', 'VVH Demo User', 'ACTIVE', 10),
((SELECT id FROM roles WHERE name = 'ADMIN'), 'system@engvocab.local', 'SYSTEM_USER_NO_LOGIN', 'System User', 'ACTIVE', 0);

SET @demo_user_id = (SELECT id FROM users WHERE email = 'vohoang131005@gmail.com');
SET @system_user_id = (SELECT id FROM users WHERE email = 'system@engvocab.local');

-- ==========================================
-- SEED DATA: FLASHCARDS
-- ==========================================
-- 1. Từ vựng cơ bản
INSERT INTO flashcard_sets (user_id, service_id, title, description, is_system)
VALUES (@system_user_id, 1, 'Từ vựng cơ bản - Beginner', 'Bộ từ vựng cơ bản cho người mới bắt đầu', TRUE);
SET @set_basic = LAST_INSERT_ID();

INSERT INTO flashcards (set_id, word, meaning, pronunciation, example_sentence, part_of_speech) VALUES 
(@set_basic, 'apple', 'quả táo', '/ˈæp.əl/', 'I eat an apple every day.', 'noun'),
(@set_basic, 'book', 'quyển sách', '/bʊk/', 'This book is very interesting.', 'noun'),
(@set_basic, 'school', 'trường học', '/skuːl/', 'My school is near my house.', 'noun'),
(@set_basic, 'friend', 'bạn bè', '/frend/', 'She is my best friend.', 'noun'),
(@set_basic, 'happy', 'vui vẻ', '/ˈhæp.i/', 'I feel happy today.', 'adjective');

-- 2. TOEIC
INSERT INTO flashcard_sets (user_id, service_id, title, description, is_system)
VALUES (@system_user_id, 2, 'TOEIC Business Vocabulary', 'Từ vựng TOEIC về công việc, văn phòng và kinh doanh', TRUE);
SET @set_toeic = LAST_INSERT_ID();

INSERT INTO flashcards (set_id, word, meaning, pronunciation, example_sentence, part_of_speech) VALUES 
(@set_toeic, 'invoice', 'hóa đơn', '/ˈɪn.vɔɪs/', 'Please send the invoice to the customer.', 'noun'),
(@set_toeic, 'deadline', 'hạn chót', '/ˈded.laɪn/', 'The deadline is next Monday.', 'noun'),
(@set_toeic, 'meeting', 'cuộc họp', '/ˈmiː.tɪŋ/', 'We have a meeting at 9 AM.', 'noun'),
(@set_toeic, 'manager', 'quản lý', '/ˈmæn.ɪ.dʒər/', 'The manager approved the plan.', 'noun'),
(@set_toeic, 'contract', 'hợp đồng', '/ˈkɒn.trækt/', 'They signed the contract yesterday.', 'noun');

-- 3. IELTS
INSERT INTO flashcard_sets (user_id, service_id, title, description, is_system)
VALUES (@system_user_id, 3, 'IELTS Academic Vocabulary', 'Từ vựng học thuật thường gặp trong IELTS', TRUE);
SET @set_ielts = LAST_INSERT_ID();

INSERT INTO flashcards (set_id, word, meaning, pronunciation, example_sentence, part_of_speech) VALUES 
(@set_ielts, 'analyze', 'phân tích', '/ˈæn.əl.aɪz/', 'Students need to analyze the chart carefully.', 'verb'),
(@set_ielts, 'significant', 'quan trọng, đáng kể', '/sɪɡˈnɪf.ɪ.kənt/', 'There was a significant increase in sales.', 'adjective'),
(@set_ielts, 'evidence', 'bằng chứng', '/ˈev.ɪ.dəns/', 'The essay needs more evidence.', 'noun'),
(@set_ielts, 'environment', 'môi trường', '/ɪnˈvaɪ.rən.mənt/', 'The environment is a global issue.', 'noun'),
(@set_ielts, 'solution', 'giải pháp', '/səˈluː.ʃən/', 'Education is one possible solution.', 'noun');

-- 4. Grammar
INSERT INTO flashcard_sets (user_id, service_id, title, description, is_system)
VALUES (@system_user_id, 4, 'Grammar Key Terms', 'Các thuật ngữ ngữ pháp tiếng Anh cơ bản', TRUE);
SET @set_grammar = LAST_INSERT_ID();

INSERT INTO flashcards (set_id, word, meaning, pronunciation, example_sentence, part_of_speech) VALUES 
(@set_grammar, 'noun', 'danh từ', '/naʊn/', 'A noun names a person, place, or thing.', 'noun'),
(@set_grammar, 'verb', 'động từ', '/vɜːb/', 'A verb shows an action.', 'noun'),
(@set_grammar, 'adjective', 'tính từ', '/ˈædʒ.ek.tɪv/', 'An adjective describes a noun.', 'noun'),
(@set_grammar, 'adverb', 'trạng từ', '/ˈæd.vɜːb/', 'An adverb describes a verb.', 'noun'),
(@set_grammar, 'tense', 'thì', '/tens/', 'English has many tenses.', 'noun');

-- 5. Từ vựng nâng cao
INSERT INTO flashcard_sets (user_id, service_id, title, description, is_system)
VALUES (@system_user_id, 5, 'Advanced Vocabulary Set', 'Từ vựng nâng cao và học thuật', TRUE);
SET @set_advanced = LAST_INSERT_ID();

INSERT INTO flashcards (set_id, word, meaning, pronunciation, example_sentence, part_of_speech) VALUES 
(@set_advanced, 'innovation', 'sự đổi mới', '/ˌɪn.əˈveɪ.ʃən/', 'Innovation drives economic growth.', 'noun'),
(@set_advanced, 'efficient', 'hiệu quả', '/ɪˈfɪʃ.ənt/', 'This method is more efficient.', 'adjective'),
(@set_advanced, 'strategy', 'chiến lược', '/ˈstræt.ə.dʒi/', 'The company changed its strategy.', 'noun'),
(@set_advanced, 'potential', 'tiềm năng', '/pəˈten.ʃəl/', 'This idea has great potential.', 'noun'),
(@set_advanced, 'sustainable', 'bền vững', '/səˈsteɪ.nə.bəl/', 'We need sustainable development.', 'adjective');

-- 6. Tài liệu cá nhân
INSERT INTO flashcard_sets (user_id, service_id, title, description, is_system)
VALUES (@system_user_id, 6, 'Sample Document Vocabulary', 'Từ vựng mẫu trích xuất từ tài liệu học tập', TRUE);
SET @set_document = LAST_INSERT_ID();

INSERT INTO flashcards (set_id, word, meaning, pronunciation, example_sentence, part_of_speech) VALUES 
(@set_document, 'document', 'tài liệu', '/ˈdɒk.jə.mənt/', 'Please upload your document.', 'noun'),
(@set_document, 'extract', 'trích xuất', '/ɪkˈstrækt/', 'The system can extract vocabulary.', 'verb'),
(@set_document, 'content', 'nội dung', '/ˈkɒn.tent/', 'The content is useful for learning.', 'noun'),
(@set_document, 'summary', 'bản tóm tắt', '/ˈsʌm.ər.i/', 'Write a short summary of the text.', 'noun'),
(@set_document, 'keyword', 'từ khóa', '/ˈkiː.wɜːd/', 'Find the important keywords.', 'noun');

-- ==========================================
-- GÁN DỮ LIỆU SRS CHO TÀI KHOẢN DEMO
-- ==========================================
INSERT INTO user_saved_sets (user_id, set_id, is_srs_enabled, daily_new_words)
SELECT @demo_user_id, id, CASE WHEN service_id IN (1, 2) THEN TRUE ELSE FALSE END, 20
FROM flashcard_sets 
WHERE user_id = @system_user_id;

INSERT INTO user_flashcards (user_id, flashcard_id, status, repetition_count, ease_factor, interval_days, next_review_date)
SELECT @demo_user_id, f.id, 'NEW', 0, 2.5, 0, NOW()
FROM flashcards f
JOIN flashcard_sets fs ON f.set_id = fs.id
WHERE fs.service_id IN (1, 2);

-- ==========================================
-- KIỂM TRA NHANH KẾT QUẢ IMPORT
-- ==========================================
SELECT id, email, full_name, status, ai_quota 
FROM users;

SELECT fs.title AS set_title, COUNT(f.id) AS total_flashcards
FROM flashcard_sets fs
LEFT JOIN flashcards f ON f.set_id = fs.id
GROUP BY fs.id, fs.title
ORDER BY fs.id;



