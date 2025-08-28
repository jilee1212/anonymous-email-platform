const nodemailer = require('nodemailer');

// 테스트용 이메일 발송
async function testEmailSending() {
  try {
    console.log('📧 테스트 이메일 발송 시작...');
    
    // 로컬 SMTP 서버로 연결
    const transporter = nodemailer.createTransport({
      host: 'localhost',
      port: 2525,
      secure: false,
      ignoreTLS: true
    });
    
    // 테스트 이메일 발송
    const info = await transporter.sendMail({
      from: 'test@example.com',
      to: 'test@nosignup.kr', // 실제 생성된 이메일 주소로 변경 필요
      subject: '테스트 이메일 - Phase 6 구현 확인',
      text: '이것은 Phase 6 SMTP 서버 구현 테스트를 위한 이메일입니다.',
      html: '<h1>Phase 6 구현 완료!</h1><p>SMTP 서버가 정상적으로 작동하고 있습니다.</p>'
    });
    
    console.log('✅ 테스트 이메일 발송 성공!');
    console.log('Message ID:', info.messageId);
    
  } catch (error) {
    console.error('❌ 테스트 이메일 발송 실패:', error.message);
  }
}

// 실행
testEmailSending();
