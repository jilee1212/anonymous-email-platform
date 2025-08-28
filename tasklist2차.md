tasklist.md: 영구 익명 이메일 플랫폼 구축 과정 (2차 개발)
1. 개요
이 TaskList는 '영구 익명 이메일 플랫폼'의 남은 핵심 기능들을 단계별로 구현하기 위한 상세 작업 목록입니다.

2. 상세 Task List
Phase 6: 이메일 수신 시스템 구축 (Email Ingestion System)
[ ] SMTP 서버 구현:

Node.js의 simple-node-mail 또는 Python의 smtpd 모듈을 사용하여 SMTP 서버를 구축합니다.

[ ] 이메일 파싱 및 저장 스크립트 개발:

수신된 메일 데이터를 파싱(헤더, 본문, 첨부파일)하여 DB에 저장하는 백엔드 로직을 개발합니다.

emailjs 또는 mail-parser와 같은 라이브러리를 활용하여 복잡한 이메일 형식을 처리합니다.

[ ] 스팸 필터링 적용:

spam-filter와 같은 라이브러리를 사용하거나, 자체 로직으로 스팸 점수를 계산하여 DB에 저장합니다.

Phase 7: 도메인 및 DNS 설정 (Domain & DNS)
[ ] DNS 레코드 설정:

DNS 관리자 페이지에서 MX 레코드를 플랫폼의 SMTP 서버로 설정합니다.

SPF, DKIM, DMARC 레코드를 추가하여 이메일 수신율과 신뢰도를 높입니다.

[ ] SSL/TLS 인증서 설정:

Let's Encrypt를 사용하여 도메인에 SSL/TLS 인증서를 발급받고 웹 서버(Nginx)에 적용합니다.

Phase 8: 백엔드 고도화 (Backend Advanced)
[ ] 이메일 검색 및 필터링 API:

GET /api/inbox/search?q=keyword와 같이 제목 또는 발신자를 기반으로 이메일을 검색하는 API를 개발합니다.

[ ] 악성코드 스캔 로직 구현:

첨부파일 업로드 시 clamav와 같은 안티바이러스 엔진을 사용하여 파일을 스캔하고, 감염된 파일을 격리 또는 삭제하는 로직을 개발합니다.

[ ] API 확장:

POST /api/send-email: 특정 이메일 주소에서 외부로 메일을 보낼 수 있는 API를 개발합니다.

POST /api/webhook: 이메일 수신 시 지정된 URL로 메타데이터를 전송하는 웹훅 시스템을 개발합니다.

Phase 9: 프론트엔드 추가 기능 (Frontend Enhancements)
[ ] 이메일 관리 UI:

받은편지함에 이메일 삭제, 복원 버튼을 추가하고, 해당 API를 연동합니다.

[ ] 이메일 본문 렌더링:

받은 메일의 HTML 본문을 안전하게 렌더링하기 위한 로직(예: DOMPurify 사용)을 구현합니다.

[ ] 사용자 설정 페이지:

'설정' 페이지를 만들어 이메일 전달 주소, 자동 응답 메시지 등을 설정할 수 있는 폼을 개발합니다.

Phase 10: 테스트, 배포 및 모니터링 (Testing, Deployment & Monitoring)
[ ] 단위/통합 테스트:

모든 백엔드 및 프론트엔드 컴포넌트에 대한 단위 테스트 코드를 작성하고, 주요 기능에 대한 통합 테스트를 진행합니다.

[ ] Docker 컨테이너화:

백엔드 서버, 데이터베이스, SMTP 서버를 각각 Docker 컨테이너로 패키징하고 docker-compose.yml 파일을 작성합니다.

[ ] 성능 및 보안 테스트:

JMeter와 같은 툴을 사용하여 부하 테스트를 진행하고, Qualys SSL Labs 등 보안 분석 도구를 사용하여 시스템의 취약점을 점검합니다.

[ ] 시스템 모니터링 구축:

Prometheus, Grafana를 설치하여 서버의 CPU, 메모리, 네트워크 트래픽 및 이메일 수신량을 모니터링하는 대시보드를 구축합니다.