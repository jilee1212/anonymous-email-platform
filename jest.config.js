module.exports = {
  // 테스트 환경 설정
  testEnvironment: 'node',
  
  // 테스트 타임아웃 (30초)
  testTimeout: 30000,
  
  // 테스트 파일 패턴
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  
  // 테스트 제외 패턴
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/'
  ],
  
  // 테스트 실행 전 실행할 파일
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // 테스트 커버리지 설정
  collectCoverage: true,
  collectCoverageFrom: [
    'routes/**/*.js',
    'utils/**/*.js',
    'database/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**'
  ],
  
  // 커버리지 리포트 형식
  coverageReporters: ['text', 'lcov', 'html'],
  
  // 테스트 중 불필요한 로그 숨기기
  silent: false,
  verbose: true,
  
  // 테스트 실행 시 환경 변수 설정
  setupFiles: ['<rootDir>/tests/setup.js'],
  
  // 테스트 실행 후 정리
  globalTeardown: '<rootDir>/tests/teardown.js'
};
