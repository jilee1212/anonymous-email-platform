const request = require('supertest');
const express = require('express');

// Express 앱 생성
const app = express();
app.use(express.json());

// 데이터베이스 모킹
const mockPool = {
  connect: jest.fn()
};

// 이메일 생성기 모킹
const mockEmailGenerator = {
  generateEmailPair: jest.fn().mockReturnValue({
    emailAddress: 'test123@localhost',
    accessKey: 'apple-banana-cherry-dragon-eagle-forest-garden-harbor-island-jungle-knight-lemon',
    createdAt: new Date()
  }),
  hashAccessKey: jest.fn().mockReturnValue('hashed_access_key_123'),
  verifyAccessKey: jest.fn().mockReturnValue(true)
};

// 모킹 설정
jest.mock('../database/connection', () => ({
  pool: mockPool
}));

jest.mock('../utils/emailGenerator', () => mockEmailGenerator);

// API 라우트 추가
app.use('/api', require('../routes/api'));

// 테스트 데이터
const testEmail = 'test@example.com';
const testAccessKey = 'apple-banana-cherry-dragon-eagle-forest-garden-harbor-island-jungle-knight-lemon';

describe('API 테스트', () => {
  beforeEach(() => {
    // 각 테스트 전에 모킹 초기화
    jest.clearAllMocks();
  });

  describe('POST /api/generate-email', () => {
    test('새 이메일 주소와 접근 키를 성공적으로 생성해야 함', async () => {
      // 모킹 설정
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({
            rows: [{ id: 1, created_at: new Date() }]
          })
          .mockResolvedValueOnce({
            rows: []
          }),
        release: jest.fn()
      };
      
      mockPool.connect.mockResolvedValue(mockClient);

      const response = await request(app)
        .post('/api/generate-email')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('emailAddress');
      expect(response.body.data).toHaveProperty('accessKey');
      expect(response.body.data).toHaveProperty('createdAt');
      expect(response.body.data).toHaveProperty('id');
    });

    test('데이터베이스 오류 시 적절한 에러 응답을 반환해야 함', async () => {
      // 데이터베이스 오류 모킹
      const mockClient = {
        query: jest.fn().mockRejectedValueOnce(new Error('Database error')),
        release: jest.fn()
      };
      
      mockPool.connect.mockResolvedValue(mockClient);

      const response = await request(app)
        .post('/api/generate-email')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('이메일 생성 중 오류가 발생했습니다.');
    });
  });

  describe('POST /api/check-access', () => {
    test('올바른 이메일과 접근 키로 인증이 성공해야 함', async () => {
      // 모킹 설정
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({
            rows: [{
              id: 1,
              email_address: testEmail,
              access_key_hash: 'hashed_key',
              created_at: new Date(),
              last_accessed_at: new Date()
            }]
          })
          .mockResolvedValueOnce({
            rows: []
          })
          .mockResolvedValueOnce({
            rows: []
          }),
        release: jest.fn()
      };
      
      mockPool.connect.mockResolvedValue(mockClient);

      const response = await request(app)
        .post('/api/check-access')
        .send({
          emailAddress: testEmail,
          accessKey: testAccessKey
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.emailAddress).toBe(testEmail);
    });

    test('잘못된 이메일 주소로 인증이 실패해야 함', async () => {
      // 사용자를 찾을 수 없음 모킹
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({
            rows: []
          })
          .mockResolvedValueOnce({
            rows: []
          }),
        release: jest.fn()
      };
      
      mockPool.connect.mockResolvedValue(mockClient);

      const response = await request(app)
        .post('/api/check-access')
        .send({
          emailAddress: 'wrong@example.com',
          accessKey: testAccessKey
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('이메일 주소 또는 접근 키가 올바르지 않습니다.');
    });

    test('입력 검증이 올바르게 작동해야 함', async () => {
      // 이메일 주소 누락
      const response1 = await request(app)
        .post('/api/check-access')
        .send({
          accessKey: testAccessKey
        })
        .expect(400);

      expect(response1.body.success).toBe(false);
      expect(response1.body.errors).toBeDefined();

      // 접근 키 누락
      const response2 = await request(app)
        .post('/api/check-access')
        .send({
          emailAddress: testEmail
        })
        .expect(400);

      expect(response2.body.success).toBe(false);
      expect(response2.body.errors).toBeDefined();
    });
  });

  describe('GET /api/inbox/:email', () => {
    test('올바른 접근 키로 받은편지함을 조회할 수 있어야 함', async () => {
      // 모킹 설정
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({
            rows: [{
              id: 1,
              access_key_hash: 'hashed_key'
            }]
          })
          .mockResolvedValueOnce({
            rows: [
              {
                id: 1,
                sender: 'sender1@example.com',
                subject: '테스트 제목 1',
                body: '테스트 내용 1',
                received_at: new Date(),
                is_read: false
              }
            ]
          }),
        release: jest.fn()
      };
      
      mockPool.connect.mockResolvedValue(mockClient);

      const response = await request(app)
        .get(`/api/inbox/${encodeURIComponent(testEmail)}?accessKey=${encodeURIComponent(testAccessKey)}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.emailAddress).toBe(testEmail);
      expect(response.body.data.emails).toHaveLength(1);
    });

    test('접근 키 없이 받은편지함 조회가 실패해야 함', async () => {
      const response = await request(app)
        .get(`/api/inbox/${encodeURIComponent(testEmail)}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('접근 키가 필요합니다.');
    });

    test('존재하지 않는 이메일 주소로 조회가 실패해야 함', async () => {
      // 사용자를 찾을 수 없음 모킹
      const mockClient = {
        query: jest.fn().mockResolvedValueOnce({
          rows: []
        }),
        release: jest.fn()
      };
      
      mockPool.connect.mockResolvedValue(mockClient);

      const response = await request(app)
        .get(`/api/inbox/nonexistent@example.com?accessKey=${encodeURIComponent(testAccessKey)}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('이메일 주소를 찾을 수 없습니다.');
    });
  });

  describe('Rate Limiting', () => {
    test('이메일 생성 요청이 제한되어야 함', async () => {
      // Rate limit을 초과하는 요청 보내기
      for (let i = 0; i < 15; i++) {
        const mockClient = {
          query: jest.fn()
            .mockResolvedValueOnce({
              rows: [{ id: i + 1, created_at: new Date() }]
            })
            .mockResolvedValueOnce({
              rows: []
            }),
          release: jest.fn()
        };
        
        mockPool.connect.mockResolvedValue(mockClient);

        // 각 요청을 순차적으로 처리하여 rate limiting이 제대로 작동하도록 함
        const response = await request(app)
          .post('/api/generate-email');
        
        if (i < 10) {
          expect(response.status).toBe(200);
        } else {
          expect(response.status).toBe(429);
        }
      }
    });
  });
});
