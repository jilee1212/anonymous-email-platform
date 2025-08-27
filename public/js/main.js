// 메인 페이지 JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const generateBtn = document.getElementById('generateBtn');
    const generatedResult = document.getElementById('generatedResult');
    const accessForm = document.getElementById('accessForm');
    const accessError = document.getElementById('accessError');
    const errorMessage = document.getElementById('errorMessage');

    // 새 이메일 생성 버튼 클릭 이벤트
    generateBtn.addEventListener('click', async function() {
        try {
            // 버튼 비활성화 및 로딩 상태
            generateBtn.disabled = true;
            generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>생성 중...';
            
            // API 호출
            const response = await fetch('/api/generate-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const result = await response.json();

            if (result.success) {
                // 생성된 결과 표시
                document.getElementById('generatedEmail').value = result.data.emailAddress;
                document.getElementById('generatedAccessKey').value = result.data.accessKey;
                generatedResult.classList.remove('hidden');
                
                // 성공 메시지 표시
                showNotification('이메일 주소와 접근 키가 성공적으로 생성되었습니다!', 'success');
                
                // 버튼을 받은편지함 접속으로 변경
                generateBtn.innerHTML = '<i class="fas fa-inbox mr-2"></i>받은편지함 접속';
                generateBtn.onclick = () => {
                    document.getElementById('emailAddress').value = result.data.emailAddress;
                    document.getElementById('accessKey').value = result.data.accessKey;
                    document.getElementById('accessForm').dispatchEvent(new Event('submit'));
                };
            } else {
                showNotification(result.error || '이메일 생성에 실패했습니다.', 'error');
            }
        } catch (error) {
            console.error('이메일 생성 오류:', error);
            showNotification('서버 연결 오류가 발생했습니다.', 'error');
        } finally {
            // 버튼 상태 복원
            generateBtn.disabled = false;
            if (!generatedResult.classList.contains('hidden')) {
                generateBtn.innerHTML = '<i class="fas fa-inbox mr-2"></i>받은편지함 접속';
            } else {
                generateBtn.innerHTML = '<i class="fas fa-magic mr-2"></i>새 이메일 주소 생성';
            }
        }
    });

    // 받은편지함 접속 폼 제출 이벤트
    accessForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const emailAddress = document.getElementById('emailAddress').value;
        const accessKey = document.getElementById('accessKey').value;
        
        // 에러 메시지 숨기기
        accessError.classList.add('hidden');
        
        try {
            // API 호출
            const response = await fetch('/api/check-access', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    emailAddress: emailAddress,
                    accessKey: accessKey
                })
            });

            const result = await response.json();

            if (result.success) {
                // 성공 시 받은편지함 페이지로 이동
                showNotification('인증이 성공했습니다! 받은편지함으로 이동합니다.', 'success');
                
                // URL 파라미터로 이메일과 접근 키 전달
                const params = new URLSearchParams({
                    email: emailAddress,
                    accessKey: accessKey
                });
                
                setTimeout(() => {
                    window.location.href = `/inbox?${params.toString()}`;
                }, 1000);
            } else {
                // 에러 메시지 표시
                errorMessage.textContent = result.error || '인증에 실패했습니다.';
                accessError.classList.remove('hidden');
            }
        } catch (error) {
            console.error('접근 확인 오류:', error);
            errorMessage.textContent = '서버 연결 오류가 발생했습니다.';
            accessError.classList.remove('hidden');
        }
    });

    // 입력 필드 유효성 검사
    const emailInput = document.getElementById('emailAddress');
    const accessKeyInput = document.getElementById('accessKey');
    
    emailInput.addEventListener('input', function() {
        if (this.value) {
            this.classList.remove('border-red-300');
            this.classList.add('border-gray-300');
        }
    });
    
    accessKeyInput.addEventListener('input', function() {
        if (this.value) {
            this.classList.remove('border-red-300');
            this.classList.add('border-gray-300');
        }
    });
});

// 클립보드에 복사하는 함수
function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    const text = element.value;
    
    if (navigator.clipboard && window.isSecureContext) {
        // 최신 브라우저용
        navigator.clipboard.writeText(text).then(() => {
            showNotification('클립보드에 복사되었습니다!', 'success');
        }).catch(() => {
            fallbackCopyTextToClipboard(text);
        });
    } else {
        // 구형 브라우저용
        fallbackCopyTextToClipboard(text);
    }
}

// 구형 브라우저용 클립보드 복사
function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showNotification('클립보드에 복사되었습니다!', 'success');
        } else {
            showNotification('클립보드 복사에 실패했습니다.', 'error');
        }
    } catch (err) {
        showNotification('클립보드 복사에 실패했습니다.', 'error');
    }
    
    document.body.removeChild(textArea);
}

// 알림 메시지 표시 함수
function showNotification(message, type = 'info') {
    // 기존 알림 제거
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // 알림 요소 생성
    const notification = document.createElement('div');
    notification.className = `notification fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 translate-x-full`;
    
    // 타입에 따른 스타일 설정
    let bgColor, textColor, icon;
    switch (type) {
        case 'success':
            bgColor = 'bg-green-500';
            textColor = 'text-white';
            icon = 'fas fa-check-circle';
            break;
        case 'error':
            bgColor = 'bg-red-500';
            textColor = 'text-white';
            icon = 'fas fa-exclamation-circle';
            break;
        case 'warning':
            bgColor = 'bg-yellow-500';
            textColor = 'text-white';
            icon = 'fas fa-exclamation-triangle';
            break;
        default:
            bgColor = 'bg-blue-500';
            textColor = 'text-white';
            icon = 'fas fa-info-circle';
    }
    
    notification.className += ` ${bgColor} ${textColor}`;
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="${icon} mr-2"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-auto text-white hover:text-gray-200">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // 알림 추가
    document.body.appendChild(notification);
    
    // 애니메이션 효과
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // 자동 제거 (5초 후)
    setTimeout(() => {
        if (notification.parentElement) {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}

// 페이지 로드 시 URL 파라미터 확인
window.addEventListener('load', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    const accessKey = urlParams.get('accessKey');
    
    if (email && accessKey) {
        // 자동으로 폼에 입력
        document.getElementById('emailAddress').value = email;
        document.getElementById('accessKey').value = accessKey;
        
        // 자동으로 폼 제출
        setTimeout(() => {
            document.getElementById('accessForm').dispatchEvent(new Event('submit'));
        }, 500);
    }
});
