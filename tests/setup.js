// 테스트 환경 설정
const { Pool } = require('pg');

// 테스트용 데이터베이스 설정
const testPool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'anonymous_email_test',
  user: 'postgres',
  password: 'password',
  max: 5,
  idleTimeoutMillis: 1000,
  connectionTimeoutMillis: 1000,
});

// 테스트용 데이터베이스 초기화
async function setupTestDatabase() {
  try {
    const client = await testPool.connect();
    
    // 테스트 테이블 생성
    await client.query(`
      DROP TABLE IF EXISTS access_logs CASCADE;
      DROP TABLE IF EXISTS emails CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email_address VARCHAR(255) UNIQUE NOT NULL,
        access_key_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE emails (
        id SERIAL PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        sender VARCHAR(255) NOT NULL,
        subject TEXT,
        body TEXT,
        received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_read BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (user_email) REFERENCES users(email_address) ON DELETE CASCADE
      );
      
      CREATE TABLE access_logs (
        id SERIAL PRIMARY KEY,
        user_email VARCHAR(255),
        ip_address INET,
        action VARCHAR(50) NOT NULL,
        success BOOLEAN NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_email) REFERENCES users(email_address) ON DELETE SET NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email_address);
      CREATE INDEX IF NOT EXISTS idx_emails_user_email ON emails(user_email);
      CREATE INDEX IF NOT EXISTS idx_emails_received_at ON emails(received_at);
    `);
    
    client.release();
    console.log('✅ 테스트 데이터베이스 초기화 완료');
  } catch (error) {
    console.error('❌ 테스트 데이터베이스 초기화 실패:', error);
    throw error;
  }
}

// 테스트 데이터베이스 정리
async function cleanupTestDatabase() {
  try {
    const client = await testPool.connect();
    
    // 테스트 데이터 정리
    await client.query('DELETE FROM access_logs');
    await client.query('DELETE FROM emails');
    await client.query('DELETE FROM users');
    
    client.release();
    console.log('✅ 테스트 데이터 정리 완료');
  } catch (error) {
    console.error('❌ 테스트 데이터 정리 실패:', error);
  }
}

// 테스트 데이터베이스 연결 종료
async function closeTestDatabase() {
  await testPool.end();
  console.log('✅ 테스트 데이터베이스 연결 종료');
}

module.exports = {
  testPool,
  setupTestDatabase,
  cleanupTestDatabase,
  closeTestDatabase
};
