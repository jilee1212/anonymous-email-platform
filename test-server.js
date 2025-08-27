const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const emailGenerator = require('./utils/emailGenerator');

const app = express();
const PORT = 3001;

// 보안 미들웨어
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS 설정
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Body 파싱 미들웨어
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));

// 메모리 기반 데이터 저장소 (테스트용)
const memoryStore = {
  users: new Map(),
  emails: new Map(),
  accessLogs: []
};

// 새 이메일 주소 및 접근 키 생성
app.post('/api/generate-email', async (req, res) => {
  try {
    // 이메일과 접근 키 쌍 생성
    const emailPair = emailGenerator.generateEmailPair();
    
    // 메모리에 저장
    const userId = Date.now();
    const hashedAccessKey = emailGenerator.hashAccessKey(emailPair.accessKey);
    
    memoryStore.users.set(emailPair.emailAddress, {
      id: userId,
      emailAddress: emailPair.emailAddress,
      accessKeyHash: hashedAccessKey,
      createdAt: emailPair.createdAt,
      lastAccessedAt: emailPair.createdAt
    });
    
    // 접근 로그 기록
    memoryStore.accessLogs.push({
      userEmail: emailPair.emailAddress,
      ipAddress: req.ip || '127.0.0.1',
      action: 'generate_email',
      success: true,
      createdAt: new Date()
    });
    
    res.json({
      success: true,
      data: {
        emailAddress: emailPair.emailAddress,
        accessKey: emailPair.accessKey,
        createdAt: emailPair.createdAt,
        id: userId
      },
      message: '이메일 주소와 접근 키가 성공적으로 생성되었습니다.'
    });
    
  } catch (error) {
    console.error('이메일 생성 오류:', error);
    res.status(500).json({
      success: false,
      error: '이메일 생성 중 오류가 발생했습니다.'
    });
  }
});

// 접근 키를 통한 인증
app.post('/api/check-access', async (req, res) => {
  try {
    const { emailAddress, accessKey } = req.body;

    if (!emailAddress || !accessKey) {
      return res.status(400).json({
        success: false,
        error: '이메일 주소와 접근 키가 필요합니다.'
      });
    }

    // 사용자 조회
    const user = memoryStore.users.get(emailAddress);
    
    if (!user) {
      // 접근 로그 기록 (실패)
      memoryStore.accessLogs.push({
        userEmail: emailAddress,
        ipAddress: req.ip || '127.0.0.1',
        action: 'check_access',
        success: false,
        createdAt: new Date()
      });
      
      return res.status(401).json({
        success: false,
        error: '이메일 주소 또는 접근 키가 올바르지 않습니다.'
      });
    }

    // 접근 키 검증
    if (!emailGenerator.verifyAccessKey(accessKey, user.accessKeyHash)) {
      // 접근 로그 기록 (실패)
      memoryStore.accessLogs.push({
        userEmail: emailAddress,
        ipAddress: req.ip || '127.0.0.1',
        action: 'check_access',
        success: false,
        createdAt: new Date()
      });
      
      return res.status(401).json({
        success: false,
        error: '이메일 주소 또는 접근 키가 올바르지 않습니다.'
      });
    }

    // 마지막 접근 시간 업데이트
    user.lastAccessedAt = new Date();

    // 접근 로그 기록 (성공)
    memoryStore.accessLogs.push({
      userEmail: emailAddress,
      ipAddress: req.ip || '127.0.0.1',
      action: 'check_access',
      success: true,
      createdAt: new Date()
    });

    res.json({
      success: true,
      data: {
        userId: user.id,
        emailAddress: user.emailAddress,
        createdAt: user.createdAt,
        lastAccessedAt: user.lastAccessedAt
      },
      message: '인증이 성공했습니다.'
    });
    
  } catch (error) {
    console.error('접근 확인 오류:', error);
    res.status(500).json({
      success: false,
      error: '접근 확인 중 오류가 발생했습니다.'
    });
  }
});

// 받은편지함 조회
app.get('/api/inbox/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { accessKey } = req.query;

    if (!accessKey) {
      return res.status(400).json({
        success: false,
        error: '접근 키가 필요합니다.'
      });
    }

    // 사용자 조회
    const user = memoryStore.users.get(email);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '이메일 주소를 찾을 수 없습니다.'
      });
    }

    // 접근 키 검증
    if (!emailGenerator.verifyAccessKey(accessKey, user.accessKeyHash)) {
      return res.status(401).json({
        success: false,
        error: '접근 키가 올바르지 않습니다.'
      });
    }

    // 받은 메일 조회 (테스트용 더미 데이터)
    const emails = memoryStore.emails.get(email) || [];

    res.json({
      success: true,
      data: {
        emailAddress: email,
        emails: emails,
        totalCount: emails.length
      },
      message: '받은편지함을 성공적으로 조회했습니다.'
    });
    
  } catch (error) {
    console.error('받은편지함 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '받은편지함 조회 중 오류가 발생했습니다.'
    });
  }
});

// 메인 페이지
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 받은편지함 페이지
app.get('/inbox', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'inbox.html'));
});

// 테스트용 더미 이메일 추가
app.post('/api/add-test-email', (req, res) => {
  try {
    const { emailAddress, accessKey, sender, subject, body } = req.body;
    
    // 사용자 검증
    const user = memoryStore.users.get(emailAddress);
    if (!user || !emailGenerator.verifyAccessKey(accessKey, user.accessKeyHash)) {
      return res.status(401).json({
        success: false,
        error: '인증에 실패했습니다.'
      });
    }
    
    // 테스트 이메일 추가
    if (!memoryStore.emails.has(emailAddress)) {
      memoryStore.emails.set(emailAddress, []);
    }
    
    const emailId = Date.now();
    const testEmail = {
      id: emailId,
      sender: sender || 'test@example.com',
      subject: subject || '테스트 이메일',
      body: body || '이것은 테스트 이메일입니다.',
      receivedAt: new Date(),
      isRead: false
    };
    
    memoryStore.emails.get(emailAddress).push(testEmail);
    
    res.json({
      success: true,
      data: {
        emailId: emailId,
        message: '테스트 이메일이 추가되었습니다.'
      }
    });
    
  } catch (error) {
    console.error('테스트 이메일 추가 오류:', error);
    res.status(500).json({
      success: false,
      error: '테스트 이메일 추가 중 오류가 발생했습니다.'
    });
  }
});

// 서버 상태 확인
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'running',
      usersCount: memoryStore.users.size,
      emailsCount: Array.from(memoryStore.emails.values()).reduce((total, emails) => total + emails.length, 0),
      accessLogsCount: memoryStore.accessLogs.length,
      uptime: process.uptime()
    }
  });
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
app.listen(PORT, () => {
  console.log(`🚀 테스트 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`📧 영구 익명 이메일 플랫폼 테스트 서버가 준비되었습니다.`);
  console.log(`🌐 http://localhost:${PORT} 에서 접속할 수 있습니다.`);
  console.log(`📊 서버 상태: http://localhost:${PORT}/api/status`);
});

// 프로세스 종료 시 정리
process.on('SIGINT', () => {
  console.log('\n🛑 테스트 서버를 종료합니다...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 테스트 서버를 종료합니다...');
  process.exit(0);
});
