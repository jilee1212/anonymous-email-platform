const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { pool } = require('../database/connection');
const emailGenerator = require('../utils/emailGenerator');
const config = require('../config/config');

const router = express.Router();

// Rate Limiting 설정
const generateEmailLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.',
    retryAfter: Math.ceil(config.rateLimit.windowMs / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const accessLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5분
  max: 20, // 5분당 20회
  message: {
    error: '접근 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.',
    retryAfter: 300
  }
});

// 새 이메일 주소 및 접근 키 생성
router.post('/generate-email', 
  generateEmailLimiter,
  async (req, res) => {
    try {
      // 이메일과 접근 키 쌍 생성
      const emailPair = emailGenerator.generateEmailPair();
      
      // 데이터베이스에 저장
      const client = await pool.connect();
      try {
        const hashedAccessKey = emailGenerator.hashAccessKey(emailPair.accessKey);
        
        const query = `
          INSERT INTO users (email_address, access_key_hash)
          VALUES ($1, $2)
          RETURNING id, created_at
        `;
        
        const result = await client.query(query, [
          emailPair.emailAddress,
          hashedAccessKey
        ]);
        
        // 접근 로그 기록
        await client.query(`
          INSERT INTO access_logs (user_email, ip_address, action, success)
          VALUES ($1, $2, $3, $4)
        `, [
          emailPair.emailAddress,
          req.ip,
          'generate_email',
          true
        ]);
        
        res.json({
          success: true,
          data: {
            emailAddress: emailPair.emailAddress,
            accessKey: emailPair.accessKey,
            createdAt: emailPair.createdAt,
            id: result.rows[0].id
          },
          message: '이메일 주소와 접근 키가 성공적으로 생성되었습니다.'
        });
        
      } finally {
        client.release();
      }
      
    } catch (error) {
      console.error('이메일 생성 오류:', error);
      res.status(500).json({
        success: false,
        error: '이메일 생성 중 오류가 발생했습니다.'
      });
    }
  }
);

// 접근 키를 통한 인증
router.post('/check-access',
  accessLimiter,
  [
    body('emailAddress').isEmail().withMessage('유효한 이메일 주소를 입력해주세요.'),
    body('accessKey').notEmpty().withMessage('접근 키를 입력해주세요.')
  ],
  async (req, res) => {
    try {
      // 입력 검증
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      const { emailAddress, accessKey } = req.body;

      // 데이터베이스에서 사용자 조회
      const client = await pool.connect();
      try {
        const query = `
          SELECT id, email_address, access_key_hash, created_at, last_accessed_at
          FROM users 
          WHERE email_address = $1
        `;
        
        const result = await client.query(query, [emailAddress]);
        
        if (result.rows.length === 0) {
          // 접근 로그 기록 (실패)
          await client.query(`
            INSERT INTO access_logs (user_email, ip_address, action, success)
            VALUES ($1, $2, $3, $4)
          `, [emailAddress, req.ip, 'check_access', false]);
          
          return res.status(401).json({
            success: false,
            error: '이메일 주소 또는 접근 키가 올바르지 않습니다.'
          });
        }

        const user = result.rows[0];
        
        // 접근 키 검증
        if (!emailGenerator.verifyAccessKey(accessKey, user.access_key_hash)) {
          // 접근 로그 기록 (실패)
          await client.query(`
            INSERT INTO access_logs (user_email, ip_address, action, success)
            VALUES ($1, $2, $3, $4)
          `, [emailAddress, req.ip, 'check_access', false]);
          
          return res.status(401).json({
            success: false,
            error: '이메일 주소 또는 접근 키가 올바르지 않습니다.'
          });
        }

        // 마지막 접근 시간 업데이트
        await client.query(`
          UPDATE users 
          SET last_accessed_at = CURRENT_TIMESTAMP 
          WHERE id = $1
        `, [user.id]);

        // 접근 로그 기록 (성공)
        await client.query(`
          INSERT INTO access_logs (user_email, ip_address, action, success)
          VALUES ($1, $2, $3, $4)
        `, [emailAddress, req.ip, 'check_access', true]);

        res.json({
          success: true,
          data: {
            userId: user.id,
            emailAddress: user.email_address,
            createdAt: user.created_at,
            lastAccessedAt: new Date()
          },
          message: '인증이 성공했습니다.'
        });
        
      } finally {
        client.release();
      }
      
    } catch (error) {
      console.error('접근 확인 오류:', error);
      res.status(500).json({
        success: false,
        error: '접근 확인 중 오류가 발생했습니다.'
      });
    }
  }
);

// 받은편지함 조회
router.get('/inbox/:email',
  accessLimiter,
  async (req, res) => {
    try {
      const { email } = req.params;
      const { accessKey } = req.query;

      if (!accessKey) {
        return res.status(400).json({
          success: false,
          error: '접근 키가 필요합니다.'
        });
      }

      // 접근 키 검증
      const client = await pool.connect();
      try {
        const userQuery = `
          SELECT id, access_key_hash 
          FROM users 
          WHERE email_address = $1
        `;
        
        const userResult = await client.query(userQuery, [email]);
        
        if (userResult.rows.length === 0) {
          return res.status(404).json({
            success: false,
            error: '이메일 주소를 찾을 수 없습니다.'
          });
        }

        const user = userResult.rows[0];
        
        if (!emailGenerator.verifyAccessKey(accessKey, user.access_key_hash)) {
          return res.status(401).json({
            success: false,
            error: '접근 키가 올바르지 않습니다.'
          });
        }

        // 받은 메일 조회
        const emailsQuery = `
          SELECT id, sender, subject, body, received_at, is_read
          FROM emails 
          WHERE user_email = $1 
          ORDER BY received_at DESC
        `;
        
        const emailsResult = await client.query(emailsQuery, [email]);
        
        res.json({
          success: true,
          data: {
            emailAddress: email,
            emails: emailsResult.rows,
            totalCount: emailsResult.rows.length
          },
          message: '받은편지함을 성공적으로 조회했습니다.'
        });
        
      } finally {
        client.release();
      }
      
    } catch (error) {
      console.error('받은편지함 조회 오류:', error);
      res.status(500).json({
        success: false,
        error: '받은편지함 조회 중 오류가 발생했습니다.'
      });
    }
  }
);

module.exports = router;
