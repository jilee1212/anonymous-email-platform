const SMTPServer = require('smtp-server').SMTPServer;
const { simpleParser } = require('mailparser');
const { pool } = require('../database/connection');
const config = require('../config/config');

class SMTPServerManager {
  constructor() {
    this.server = null;
    this.port = config.smtp?.port || 10000;  // 기본값을 10000으로 변경
  }

  // SMTP 서버 시작
  start(port = null) {
    // 포트가 전달되면 사용, 아니면 설정된 포트 사용
    this.port = port || this.port;
    this.server = new SMTPServer({
      secure: false, // 개발 환경에서는 false, 프로덕션에서는 true
      authOptional: true, // 인증 선택사항
      maxSize: 10 * 1024 * 1024, // 최대 10MB
      maxConnections: 100,
      onData: this.handleEmail.bind(this),
      onRcptTo: this.handleRcptTo.bind(this),
      onMailFrom: this.handleMailFrom.bind(this)
    });

    // 서버 시작
    this.server.listen(this.port, () => {
      console.log(`📧 SMTP 서버가 포트 ${this.port}에서 실행 중입니다.`);
    });

    // 에러 처리
    this.server.on('error', (err) => {
      console.error('❌ SMTP 서버 오류:', err);
    });
  }

  // 발신자 처리
  handleMailFrom(address, session, callback) {
    console.log('📤 발신자:', address.address);
    callback();
  }

  // 수신자 처리
  handleRcptTo(address, session, callback) {
    console.log('📥 수신자:', address.address);
    callback();
  }

  // 이메일 수신 처리
  async handleEmail(stream, session, callback) {
    try {
      console.log('📨 새 이메일 수신:', session.envelope.mailFrom?.address);
      
      // 이메일 데이터 수집
      let emailData = '';
      stream.on('data', (chunk) => {
        emailData += chunk;
      });

      stream.on('end', async () => {
        try {
          // 이메일 파싱
          const parsedEmail = await this.parseEmail(emailData, session);
          
          // 데이터베이스에 저장
          await this.saveEmail(parsedEmail);
          
          console.log('✅ 이메일 저장 완료:', parsedEmail.subject);
          
        } catch (error) {
          console.error('❌ 이메일 처리 오류:', error);
        }
      });

      callback();
    } catch (error) {
      console.error('❌ 이메일 수신 처리 오류:', error);
      callback(new Error('이메일 처리 실패'));
    }
  }

  // 이메일 파싱
  async parseEmail(rawEmail, session) {
    try {
      const parsed = await simpleParser(rawEmail);
      
      const emailData = {
        from: parsed.from?.text || parsed.from?.value?.[0]?.address || 'unknown@unknown.com',
        to: session.envelope.rcptTo?.[0]?.address || '',
        subject: parsed.subject || '(제목 없음)',
        text: parsed.text || '',
        html: parsed.html || '',
        receivedAt: new Date(),
        headers: parsed.headers,
        attachments: parsed.attachments || []
      };

      return emailData;
    } catch (error) {
      console.error('❌ 이메일 파싱 오류:', error);
      throw error;
    }
  }

  // 이메일을 데이터베이스에 저장
  async saveEmail(emailData) {
    const client = await pool.connect();
    try {
      // 수신자 이메일 주소 추출 (도메인 확인)
      const recipientEmail = this.extractRecipientEmail(emailData.to);
      
      if (!recipientEmail) {
        console.log('⚠️ 유효하지 않은 수신자 이메일:', emailData.to);
        return;
      }

      // 사용자 존재 여부 확인
      const userQuery = `
        SELECT id FROM users 
        WHERE email_address = $1
      `;
      
      const userResult = await client.query(userQuery, [recipientEmail]);
      
      if (userResult.rows.length === 0) {
        console.log('⚠️ 등록되지 않은 이메일 주소:', recipientEmail);
        return;
      }

      // 이메일 저장
      const insertQuery = `
        INSERT INTO emails (user_email, sender, subject, body, received_at, is_read)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `;

      const emailBody = emailData.html || emailData.text;
      
      const result = await client.query(insertQuery, [
        recipientEmail,
        emailData.from,
        emailData.subject,
        emailBody,
        emailData.receivedAt,
        false
      ]);

      console.log('✅ 이메일 저장 완료, ID:', result.rows[0].id);

      // 첨부파일이 있다면 별도 처리
      if (emailData.attachments.length > 0) {
        await this.handleAttachments(result.rows[0].id, emailData.attachments);
      }

    } catch (error) {
      console.error('❌ 이메일 저장 오류:', error);
    } finally {
      client.release();
    }
  }

  // 수신자 이메일 주소 추출
  extractRecipientEmail(toField) {
    try {
      // 이메일 주소 패턴 매칭
      const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/;
      const match = toField.match(emailRegex);
      
      if (match && match[1]) {
        return match[1];
      }
      
      return null;
    } catch (error) {
      console.error('❌ 이메일 주소 추출 오류:', error);
      return null;
    }
  }

  // 첨부파일 처리
  async handleAttachments(emailId, attachments) {
    try {
      console.log(`📎 첨부파일 ${attachments.length}개 처리 중...`);
      
      // 첨부파일 정보를 로그로 기록 (실제 파일 저장은 보안상 제한)
      attachments.forEach((attachment, index) => {
        console.log(`📎 첨부파일 ${index + 1}: ${attachment.filename} (${attachment.contentType})`);
      });
      
    } catch (error) {
      console.error('❌ 첨부파일 처리 오류:', error);
    }
  }

  // SMTP 서버 중지
  stop() {
    if (this.server) {
      this.server.close(() => {
        console.log('🛑 SMTP 서버가 중지되었습니다.');
      });
    }
  }
}

module.exports = new SMTPServerManager();
