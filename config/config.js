require('dotenv').config();

module.exports = {
  // 데이터베이스 설정
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'anonymous_email',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password'
  },
  
  // 서버 설정
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  
  // 보안 설정
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your_super_secret_jwt_key_here',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12
  },
  
  // 도메인 설정
  domain: {
    main: process.env.DOMAIN || 'localhost',
    email: process.env.EMAIL_DOMAIN || 'localhost'
  },
  
  // Rate Limiting 설정
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15분
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10
  },
  
  // 로깅 설정
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};
