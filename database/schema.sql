-- 영구 익명 이메일 플랫폼 데이터베이스 스키마 (PostgreSQL용)

-- 사용자 테이블 (이메일 주소와 암호화된 접근 키)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email_address VARCHAR(255) UNIQUE NOT NULL,
    access_key_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 이메일 테이블 (수신된 메일 데이터)
CREATE TABLE IF NOT EXISTS emails (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    sender VARCHAR(255) NOT NULL,
    subject TEXT,
    body TEXT,
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_email) REFERENCES users(email_address) ON DELETE CASCADE
);

-- 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email_address);
CREATE INDEX IF NOT EXISTS idx_emails_user_email ON emails(user_email);
CREATE INDEX IF NOT EXISTS idx_emails_received_at ON emails(received_at);

-- 접근 로그 테이블 (보안 및 모니터링)
CREATE TABLE IF NOT EXISTS access_logs (
    id SERIAL PRIMARY KEY,
    user_email VARCHAR(255),
    ip_address INET,
    action VARCHAR(50) NOT NULL,
    success BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_email) REFERENCES users(email_address) ON DELETE SET NULL
);

-- Rate limiting을 위한 테이블
CREATE TABLE IF NOT EXISTS rate_limits (
    id SERIAL PRIMARY KEY,
    ip_address INET UNIQUE NOT NULL,
    request_count INTEGER DEFAULT 1,
    first_request_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_request_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 샘플 데이터 (테스트용)
INSERT INTO users (email_address, access_key_hash) VALUES 
('test@example.com', '$2a$10$example.hash.here');

-- 테이블 정보 조회
\dt
