const axios = require('axios');

// 이메일 수신 테스트
async function testEmailReceive() {
  try {
    console.log('📧 이메일 수신 테스트 시작...');
    
    const emailData = {
      from: 'test@gmail.com',
      to: '126d17e54a78a8aa3088826749b14ba3@nosignup.kr',
      subject: '테스트 이메일',
      body: '이것은 HTTP를 통한 이메일 수신 테스트입니다.'
    };
    
    const response = await axios.post('http://localhost:10000/receive-email', emailData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ 이메일 수신 성공:', response.data);
    
  } catch (error) {
    console.error('❌ 이메일 수신 실패:', error.response?.data || error.message);
  }
}

// 테스트 실행
testEmailReceive();
