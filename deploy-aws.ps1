# AWS 배포 스크립트 (PowerShell)
# 실행 전 AWS CLI와 EB CLI가 설치되어 있어야 합니다.

Write-Host "🚀 AWS Elastic Beanstalk 배포 시작..." -ForegroundColor Green

# 1. 의존성 설치
Write-Host "📦 의존성 설치 중..." -ForegroundColor Yellow
npm install

# 2. 테스트 실행
Write-Host "🧪 테스트 실행 중..." -ForegroundColor Yellow
npm test

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 테스트 실패! 배포를 중단합니다." -ForegroundColor Red
    exit 1
}

Write-Host "✅ 테스트 통과!" -ForegroundColor Green

# 3. Git 상태 확인
Write-Host "📝 Git 상태 확인 중..." -ForegroundColor Yellow
$gitStatus = git status --porcelain
if ($gitStatus) {
    Write-Host "⚠️  커밋되지 않은 변경사항이 있습니다:" -ForegroundColor Yellow
    Write-Host $gitStatus -ForegroundColor Gray
    
    $commit = Read-Host "변경사항을 커밋하시겠습니까? (y/n)"
    if ($commit -eq 'y' -or $commit -eq 'Y') {
        git add .
        $commitMessage = Read-Host "커밋 메시지를 입력하세요"
        git commit -m $commitMessage
    }
}

# 4. EB 초기화 (처음 실행시)
if (-not (Test-Path ".elasticbeanstalk")) {
    Write-Host "🔧 Elastic Beanstalk 초기화 중..." -ForegroundColor Yellow
    Write-Host "AWS 자격 증명이 설정되어 있는지 확인하세요." -ForegroundColor Cyan
    eb init
}

# 5. 환경 생성 또는 배포
$envExists = eb status 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "🔄 기존 환경에 배포 중..." -ForegroundColor Yellow
    eb deploy
} else {
    Write-Host "🏗️  새로운 환경 생성 중..." -ForegroundColor Yellow
    eb create production
}

# 6. 배포 상태 확인
Write-Host "📊 배포 상태 확인 중..." -ForegroundColor Yellow
eb status

Write-Host "🎉 배포 완료!" -ForegroundColor Green
Write-Host "웹사이트 URL: $(eb status | Select-String 'CNAME')" -ForegroundColor Cyan

# 7. 로그 확인 옵션
$showLogs = Read-Host "로그를 확인하시겠습니까? (y/n)"
if ($showLogs -eq 'y' -or $showLogs -eq 'Y') {
    eb logs --all --stream
}
