# AWS 배포 가이드

## 🚀 AWS Elastic Beanstalk을 통한 통합 배포

이 가이드는 프론트엔드와 백엔드를 구분 없이 AWS에 통합 배포하는 방법을 설명합니다.

## 📋 사전 요구사항

### 1. AWS 계정 생성
- [AWS Console](https://aws.amazon.com/)에서 계정 생성
- IAM 사용자 생성 및 권한 설정
- AWS Access Key ID와 Secret Access Key 발급

### 2. AWS CLI 설치
```bash
# Windows (PowerShell)
winget install -e --id Amazon.AWSCLI

# 또는 Chocolatey 사용
choco install awscli

# 설치 확인
aws --version
```

### 3. AWS EB CLI 설치
```bash
# Windows
pip install awsebcli

# 설치 확인
eb --version
```

## 🔧 AWS 설정

### 1. AWS 자격 증명 설정
```bash
aws configure
# AWS Access Key ID 입력
# AWS Secret Access Key 입력
# Default region name: ap-northeast-2 (서울)
# Default output format: json
```

### 2. Elastic Beanstalk 애플리케이션 초기화
```bash
eb init
# 애플리케이션 이름: anonymous-email-platform
# 플랫폼: Node.js
# Node.js 버전: 18
# SSH 설정: 필요시 설정
```

### 3. 환경 생성
```bash
eb create production
# 환경 이름: production
# DNS CNAME prefix: 자동 생성
# 인스턴스 타입: t3.micro (프리티어)
```

## 📁 배포 파일 구조

```
anonymous-email-platform/
├── .ebextensions/           # EB 설정 파일
│   └── 01_environment.config
├── public/                  # 정적 파일 (자동 서빙)
├── routes/                  # API 라우트
├── database/                # DB 설정
├── utils/                   # 유틸리티
├── server.js                # 메인 서버
├── package.json             # 의존성 및 스크립트
└── AWS_DEPLOYMENT.md        # 이 가이드
```

## 🌐 배포 프로세스

### 1. 코드 커밋
```bash
git add .
git commit -m "AWS 배포 준비 완료"
```

### 2. 배포 실행
```bash
eb deploy
```

### 3. 배포 상태 확인
```bash
eb status
eb health
```

### 4. 로그 확인
```bash
eb logs
```

## 💰 비용 최적화

### 프리티어 (12개월)
- **EC2**: t3.micro (1GB RAM, 2 vCPU)
- **데이터 전송**: 월 15GB
- **스토리지**: EBS 30GB

### 프리티어 이후
- **EC2 t3.micro**: 월 $8-12
- **데이터 전송**: GB당 $0.09
- **스토리지**: GB당 $0.10

## 🔒 보안 설정

### 1. 환경 변수 설정
```bash
eb setenv NODE_ENV=production
eb setenv DB_HOST=your-rds-endpoint
eb setenv DB_PASSWORD=your-db-password
```

### 2. HTTPS 설정
- Elastic Beanstalk에서 자동으로 SSL 인증서 관리
- Route 53을 통한 도메인 연결

## 📊 모니터링 및 로깅

### 1. CloudWatch 모니터링
- CPU, 메모리, 네트워크 사용량
- 애플리케이션 로그
- 커스텀 메트릭

### 2. 로그 설정
```bash
# 실시간 로그 스트리밍
eb logs --all --stream

# 특정 로그 파일 확인
eb ssh
tail -f /var/log/nodejs/nodejs.log
```

## 🚨 문제 해결

### 1. 배포 실패
```bash
# 배포 상태 확인
eb status

# 로그 확인
eb logs

# 환경 재시작
eb restart
```

### 2. 정적 파일 서빙 문제
- `.ebextensions/01_environment.config` 확인
- Nginx 설정 확인
- 파일 권한 확인

### 3. 데이터베이스 연결 문제
- 보안 그룹 설정 확인
- 환경 변수 확인
- RDS 엔드포인트 확인

## 🔄 자동 배포 설정

### 1. GitHub Actions 연동
```yaml
# .github/workflows/deploy.yml
name: Deploy to AWS
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to EB
        uses: einaregilsson/beanstalk-deploy@v21
        with:
          aws_access_key: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws_secret_key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          application_name: anonymous-email-platform
          environment_name: production
          region: ap-northeast-2
```

## 📱 배포 후 테스트

### 1. 기본 기능 테스트
- 이메일 생성: `POST /api/generate-email`
- 접근 확인: `POST /api/check-access`
- 받은편지함: `GET /api/inbox/:email`

### 2. 성능 테스트
- 부하 테스트: Apache Bench, Artillery
- 응답 시간 측정
- 동시 사용자 처리 능력

## 🎯 다음 단계

1. **도메인 설정**: Route 53을 통한 커스텀 도메인
2. **CDN 설정**: CloudFront를 통한 정적 파일 최적화
3. **데이터베이스**: RDS PostgreSQL 설정
4. **이메일 서버**: SES 또는 외부 SMTP 서버 연동
5. **모니터링**: CloudWatch 대시보드 설정

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. AWS Elastic Beanstalk 문서
2. CloudWatch 로그
3. EB CLI 도움말: `eb --help`
4. AWS Support (계정 레벨에 따라)

---

**⚠️ 주의**: 프로덕션 배포 전에 보안 설정과 환경 변수를 반드시 확인하세요.
