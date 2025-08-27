const { Pool } = require('pg');
const config = require('../config/config');

// 데이터베이스 연결 풀 생성
const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  max: 20, // 최대 연결 수
  idleTimeoutMillis: 30000, // 유휴 연결 타임아웃
  connectionTimeoutMillis: 2000, // 연결 타임아웃
});

// 연결 테스트
pool.on('connect', () => {
  console.log('✅ PostgreSQL 데이터베이스에 연결되었습니다.');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL 연결 오류:', err);
});

// 데이터베이스 연결 테스트 함수
async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('✅ 데이터베이스 연결 테스트 성공:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('❌ 데이터베이스 연결 테스트 실패:', error);
    return false;
  }
}

// 데이터베이스 초기화 함수
async function initializeDatabase() {
  try {
    const client = await pool.connect();
    
    // 스키마 파일 실행
    const schemaSQL = `
      -- 사용자 테이블이 없으면 생성
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email_address VARCHAR(255) UNIQUE NOT NULL,
        access_key_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      -- 이메일 테이블이 없으면 생성
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
      
      -- 접근 로그 테이블이 없으면 생성
      CREATE TABLE IF NOT EXISTS access_logs (
        id SERIAL PRIMARY KEY,
        user_email VARCHAR(255),
        ip_address INET,
        action VARCHAR(50) NOT NULL,
        success BOOLEAN NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_email) REFERENCES users(email_address) ON DELETE SET NULL
      );
      
      -- 인덱스 생성
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email_address);
      CREATE INDEX IF NOT EXISTS idx_emails_user_email ON emails(user_email);
      CREATE INDEX IF NOT EXISTS idx_emails_received_at ON emails(received_at);
    `;
    
    await client.query(schemaSQL);
    client.release();
    
    console.log('✅ 데이터베이스 초기화 완료');
    return true;
  } catch (error) {
    console.error('❌ 데이터베이스 초기화 실패:', error);
    return false;
  }
}

module.exports = {
  pool,
  testConnection,
  initializeDatabase
};
