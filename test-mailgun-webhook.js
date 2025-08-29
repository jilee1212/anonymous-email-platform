const axios = require('axios');

// Mailgun Webhook 형식으로 이메일 수신 테스트
async function testMailgunWebhook() {
  try {
    console.log('📧 Mailgun Webhook 이메일 수신 테스트 시작...');
    
    // Mailgun webhook 형식의 데이터
    const webhookData = {
      'sender': 'test@gmail.com',
      'recipient': '126d17e54a78a8aa3088826749b14ba3@nosignup.kr',
      'subject': 'Mailgun Webhook 테스트 이메일',
      'body-plain': '이것은 Mailgun Webhook을 통한 이메일 수신 테스트입니다.',
      'body-html': '<p>이것은 <strong>Mailgun Webhook</strong>을 통한 이메일 수신 테스트입니다.</p>',
      'message-id': 'test-message-id-123',
      'timestamp': Date.now()
    };
    
    const response = await axios.post('http://localhost:10000/receive-email', webhookData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    console.log('✅ Mailgun Webhook 이메일 수신 성공:', response.data);
    
  } catch (error) {
    console.error('❌ Mailgun Webhook 이메일 수신 실패:', error.response?.data || error.message);
  }
}

// 테스트 실행
testMailgunWebhook();
