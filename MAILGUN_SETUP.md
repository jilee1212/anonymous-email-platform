# 📧 Mailgun 설정 가이드

## 🎯 **Mailgun을 통한 이메일 수신 설정**

### **1단계: Mailgun 계정 생성**
1. [Mailgun](https://www.mailgun.com/) 접속
2. **Sign Up** 클릭 (무료 계정)
3. **월 5,000건 이메일 수신 무료**

### **2단계: 도메인 추가**
1. **Domains** → **Add New Domain**
2. **Domain Name**: `nosignup.kr` 입력
3. **Create Domain** 클릭

### **3단계: DNS 설정**
Mailgun에서 제공하는 DNS 레코드를 `nosignup.kr` 도메인에 추가:

```
# MX 레코드 (이메일 수신용)
Type: MX
Name: @
Value: mxa.mailgun.org
Priority: 10

# TXT 레코드 (SPF)
Type: TXT
Name: @
Value: v=spf1 include:mailgun.org ~all

# CNAME 레코드 (이메일 추적용)
Type: CNAME
Name: email
Value: mailgun.org
```

### **4단계: Inbound Routes 설정**
1. **Receiving** → **Inbound Routes**
2. **Create Route** 클릭
3. **Route Expression**: `catch_all()` (모든 이메일 수신)
4. **Action**: `forward("https://nosignup.kr/receive-email")`
5. **Create Route** 클릭

### **5단계: Webhook URL 설정**
- **Webhook URL**: `https://nosignup.kr/receive-email`
- **Method**: POST
- **Content Type**: `application/x-www-form-urlencoded`

## 🔧 **동작 방식**

1. **Gmail에서 `test@nosignup.kr`로 이메일 발송**
2. **Mailgun이 이메일을 수신**
3. **Mailgun이 webhook으로 `https://nosignup.kr/receive-email`에 POST 요청**
4. **백엔드에서 이메일 데이터를 파싱하여 데이터베이스에 저장**
5. **사용자가 받은편지함에서 이메일 확인**

## 📊 **Mailgun 데이터 형식**

```javascript
{
  'sender': 'test@gmail.com',           // 발신자
  'recipient': 'test@nosignup.kr',      // 수신자
  'subject': '테스트 이메일',            // 제목
  'body-plain': '텍스트 내용',          // 텍스트 본문
  'body-html': '<p>HTML 내용</p>',     // HTML 본문
  'message-id': 'unique-id',            // 메시지 ID
  'timestamp': '1234567890'             // 타임스탬프
}
```

## ✅ **장점**

- **월 5,000건 무료** (SendGrid 대비 50배)
- **안정적인 서비스** (업계 표준)
- **도메인 인증 지원** (@nosignup.kr)
- **Webhook 자동화** (실시간 이메일 수신)
- **스팸 필터링** (자동 차단)

## 🚀 **테스트 방법**

```bash
# 로컬 테스트
node test-mailgun-webhook.js

# 실제 이메일 테스트
# Gmail에서 test@nosignup.kr로 이메일 발송
```

## 🔒 **보안 고려사항**

- **Webhook 인증**: Mailgun API 키로 요청 검증
- **Rate Limiting**: 과도한 요청 차단
- **도메인 검증**: @nosignup.kr 도메인만 허용
