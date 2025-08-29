const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const config = require('./config/config');
const { testConnection, initializeDatabase } = require('./database/connection');
const apiRoutes = require('./routes/api');
const smtpServer = require('./utils/smtpServer');

const app = express();

// Trust proxy 설정 추가 (Rate Limit 오류 해결)
app.set('trust proxy', 1);

const PORT = config.server.port;

// 보안 미들웨어
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.tailwindcss.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com"],
      scriptSrcElem: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
    },
  },
}));

// CORS 설정
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [`https://${config.domain.main}`] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Body 파싱 미들웨어
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));

// API 라우터
app.use('/api', apiRoutes);

// 메인 페이지
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 받은편지함 페이지
app.get('/inbox', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'inbox.html'));
});

// 404 에러 핸들링
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: '요청한 리소스를 찾을 수 없습니다.'
  });
});

// 전역 에러 핸들링
app.use((error, req, res, next) => {
  console.error('서버 오류:', error);
  res.status(500).json({
    success: false,
    error: '서버 내부 오류가 발생했습니다.'
  });
});

// 서버 시작
async function startServer() {
  try {
    // 데이터베이스 연결 테스트
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ 데이터베이스 연결에 실패했습니다. 서버를 시작할 수 없습니다.');
      process.exit(1);
    }

    // 데이터베이스 초기화
    await initializeDatabase();

    // 서버 시작
    app.listen(PORT, () => {
      console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
      console.log(`📧 영구 익명 이메일 플랫폼이 준비되었습니다.`);
      console.log(`🌐 http://localhost:${PORT} 에서 접속할 수 있습니다.`);
      console.log(`🌍 도메인: ${config.domain.main}`);
      console.log(`📧 이메일 도메인: ${config.domain.email}`);
    });

    // SMTP 서버 시작 (HTTP 서버와 동일한 포트에서 실행)
    const smtpPort = config.server.port; // 10000
    smtpServer.start(smtpPort);
    console.log(`📧 SMTP 서버가 포트 ${smtpPort}에서 실행 중입니다.`);

  } catch (error) {
    console.error('❌ 서버 시작 실패:', error);
    process.exit(1);
  }
}

// 프로세스 종료 시 정리
process.on('SIGINT', () => {
  console.log('\n🛑 서버를 종료합니다...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 서버를 종료합니다...');
  process.exit(0);
});

// 서버 시작
startServer();
