const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Docker 환경인지 확인 (환경 변수로 판단)
const isDocker = process.env.DB_HOST && process.env.DB_HOST !== 'localhost';

let pool, db;

if (isDocker) {
  // Docker 환경: PostgreSQL 사용
  console.log('🐳 Docker 환경에서 PostgreSQL을 사용합니다.');
  
  const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
  
  pool = new Pool({
    connectionString: connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on('connect', () => {
    console.log('✅ PostgreSQL 데이터베이스에 연결되었습니다.');
  });

  pool.on('error', (err) => {
    console.error('❌ PostgreSQL 연결 오류:', err);
  });
} else {
  // 로컬 환경: SQLite 사용
  console.log('💻 로컬 환경에서 SQLite를 사용합니다.');
  
  const dbPath = path.join(__dirname, 'anonymous_email.db');
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('❌ SQLite 데이터베이스 연결 실패:', err);
    } else {
      console.log('✅ SQLite 데이터베이스에 연결되었습니다.');
    }
  });
}

// 데이터베이스 연결 테스트 함수
async function testConnection() {
  if (isDocker) {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT NOW() as test');
      client.release();
      console.log('✅ PostgreSQL 연결 테스트 성공:', result.rows[0]);
      return true;
    } catch (error) {
      console.error('❌ PostgreSQL 연결 테스트 실패:', error);
      return false;
    }
  } else {
    return new Promise((resolve) => {
      db.get('SELECT 1 as test', (err, row) => {
        if (err) {
          console.error('❌ SQLite 연결 테스트 실패:', err);
          resolve(false);
        } else {
          console.log('✅ SQLite 연결 테스트 성공:', row);
          resolve(true);
        }
      });
    });
  }
}

// 데이터베이스 초기화 함수
async function initializeDatabase() {
  if (isDocker) {
    try {
      const client = await pool.connect();
      console.log('✅ PostgreSQL 데이터베이스 초기화 완료 (스키마는 컨테이너 시작 시 자동 생성됨)');
      client.release();
      return true;
    } catch (error) {
      console.error('❌ PostgreSQL 데이터베이스 초기화 실패:', error);
      return false;
    }
  } else {
    return new Promise((resolve) => {
      const schemaSQL = `
        -- 사용자 테이블이 없으면 생성
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email_address TEXT UNIQUE NOT NULL,
          access_key_hash TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        -- 이메일 테이블이 없으면 생성
        CREATE TABLE IF NOT EXISTS emails (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_email TEXT NOT NULL,
          sender TEXT NOT NULL,
          subject TEXT,
          body TEXT,
          received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_read BOOLEAN DEFAULT 0,
          FOREIGN KEY (user_email) REFERENCES users(email_address) ON DELETE CASCADE
        );
        
        -- 접근 로그 테이블이 없으면 생성
        CREATE TABLE IF NOT EXISTS access_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_email TEXT,
          ip_address TEXT,
          action TEXT NOT NULL,
          success BOOLEAN NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_email) REFERENCES users(email_address) ON DELETE SET NULL
        );
        
        -- 인덱스 생성
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email_address);
        CREATE INDEX IF NOT EXISTS idx_emails_user_email ON emails(user_email);
        CREATE INDEX IF NOT EXISTS idx_emails_received_at ON emails(received_at);
      `;
      
      db.exec(schemaSQL, (err) => {
        if (err) {
          console.error('❌ SQLite 데이터베이스 초기화 실패:', err);
          resolve(false);
        } else {
          console.log('✅ SQLite 데이터베이스 초기화 완료');
          resolve(true);
        }
      });
    });
  }
}

// PostgreSQL과 호환되는 pool 인터페이스 제공
const poolInterface = {
  connect: () => {
    if (isDocker) {
      return pool.connect();
    } else {
      return Promise.resolve({
        query: (sql, params = []) => {
          return new Promise((resolve, reject) => {
            if (sql.trim().toLowerCase().startsWith('select')) {
              db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve({ rows });
              });
            } else {
              db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve({ rows: [{ id: this.lastID }] });
              });
            }
          });
        },
        release: () => {}
      });
    }
  }
};

module.exports = {
  pool: poolInterface,
  testConnection,
  initializeDatabase
};
