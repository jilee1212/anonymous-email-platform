# 영구 익명 이메일 플랫폼

SecureArbitrage.com을 위한 안전한 익명 이메일 서비스입니다.

## 🚀 주요 기능

- **계정 없는 이메일 생성**: 회원가입 없이 즉시 익명 이메일 주소 생성
- **접근 키 기반 보안**: 12개 단어 조합으로 구성된 안전한 접근 키
- **영구 데이터 보관**: 이메일 데이터가 자동으로 삭제되지 않음
- **완전 익명**: 개인정보 수집 없이 사용 가능

## 🛠️ 기술 스택

- **프론트엔드**: HTML5, CSS3 (Tailwind CSS), JavaScript (ES6+)
- **백엔드**: Node.js, Express.js
- **데이터베이스**: PostgreSQL
- **보안**: bcrypt, rate limiting, input validation

## 📱 데모

- **GitHub Pages**: [https://your-username.github.io/anonymous-email-platform](https://your-username.github.io/anonymous-email-platform)
- **로컬 테스트**: http://localhost:3001

## 🚀 빠른 시작

### 1. 저장소 클론
```bash
git clone https://github.com/your-username/anonymous-email-platform.git
cd anonymous-email-platform
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 변수 설정
```bash
# .env 파일 생성
DB_HOST=localhost
DB_PORT=5432
DB_NAME=anonymous_email
DB_USER=postgres
DB_PASSWORD=password
```

### 4. 데이터베이스 설정
```bash
# PostgreSQL 설치 및 실행
# 데이터베이스 생성
createdb anonymous_email
```

### 5. 서버 실행
```bash
npm start
```

### 6. 테스트 서버 실행 (데이터베이스 없이)
```bash
node test-server.js
```

## 🧪 테스트

```bash
npm test
```

## 📁 프로젝트 구조

```
anonymous-email-platform/
├── public/                 # 프론트엔드 파일
│   ├── index.html         # 메인 페이지
│   ├── inbox.html         # 받은편지함 페이지
│   └── js/               # JavaScript 파일
├── routes/                # API 라우트
├── database/              # 데이터베이스 설정
├── utils/                 # 유틸리티 함수
├── tests/                 # 테스트 파일
├── server.js              # 메인 서버
└── test-server.js         # 테스트용 서버
```

## 🔧 API 엔드포인트

- `POST /api/generate-email` - 새 이메일 주소 및 접근 키 생성
- `POST /api/check-access` - 접근 키를 통한 인증
- `GET /api/inbox/:email` - 받은편지함 조회
- `GET /api/status` - 서버 상태 확인

## 🌐 배포

### GitHub Pages 배포

1. GitHub 저장소 생성
2. 코드 푸시
3. Settings > Pages에서 배포 설정
4. `gh-pages` 브랜치 또는 `main` 브랜치의 `/docs` 폴더 선택

### 백엔드 호스팅

- **Heroku**: 무료 티어로 API 호스팅
- **Railway**: 간단한 배포
- **Render**: 무료 호스팅 서비스
- **Vercel**: Serverless 함수로 API 구현

## 🔒 보안 기능

- Rate Limiting (IP 기반 요청 제한)
- 입력 검증 및 sanitization
- CORS 설정
- Helmet.js를 통한 보안 헤더
- 접근 로그 기록

## 📝 라이선스

MIT License

## 🤝 기여

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 GitHub Issues를 통해 연락해주세요.

---

**⚠️ 주의**: 이 서비스는 교육 및 테스트 목적으로 제작되었습니다. 실제 프로덕션 환경에서 사용하기 전에 충분한 보안 검토가 필요합니다.
