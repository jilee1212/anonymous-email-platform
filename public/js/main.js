// 익명 이메일 플랫폼 메인 JavaScript

// 새 이메일 생성 함수
async function generateEmail() {
    try {
        // 로딩 상태 표시
        const generateBtn = document.querySelector('.btn');
        const originalText = generateBtn.innerHTML;
        generateBtn.innerHTML = '<span class="spinner"></span> 생성 중...';
        generateBtn.disabled = true;

        const response = await fetch('/api/generate-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            const data = await response.json();
            
            // 백엔드 응답 구조에 맞게 수정
            const email = data.data.emailAddress;
            const accessKey = data.data.accessKey;
            
            // 모달에 데이터 설정
            document.getElementById('modalEmail').value = email;
            document.getElementById('modalAccessKey').value = accessKey;
            
            // 모달 표시
            showModal();
            
            // 성공 메시지
            showNotification('✅ 새 이메일 주소가 생성되었습니다!', 'success');
        } else {
            const errorData = await response.json();
            showNotification(`❌ 오류: ${errorData.error}`, 'error');
        }
    } catch (error) {
        console.error('이메일 생성 오류:', error);
        showNotification('❌ 서버 연결 오류가 발생했습니다.', 'error');
    } finally {
        // 버튼 상태 복원
        const generateBtn = document.querySelector('.btn');
        generateBtn.innerHTML = originalText;
        generateBtn.disabled = false;
    }
}

// 받은편지함 접속 함수
async function accessInbox() {
    const email = document.getElementById('emailAddress').value.trim();
    const accessKey = document.getElementById('accessKeyInput').value.trim();

    if (!email || !accessKey) {
        showNotification('❌ 이메일 주소와 접근 키를 모두 입력해주세요.', 'error');
        return;
    }

    try {
        // 로딩 상태 표시
        const accessBtn = document.getElementById('accessInboxBtn');
        const originalText = accessBtn.innerHTML;
        accessBtn.innerHTML = '<span class="spinner"></span> 접속 중...';
        accessBtn.disabled = true;

        const response = await fetch('/api/check-access', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, accessKey })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                // 받은편지함 페이지로 이동
                window.location.href = `/inbox.html?email=${encodeURIComponent(email)}&accessKey=${encodeURIComponent(accessKey)}`;
            } else {
                showNotification('❌ 잘못된 이메일 주소 또는 접근 키입니다.', 'error');
            }
        } else {
            const errorData = await response.json();
            showNotification(`❌ 오류: ${errorData.error}`, 'error');
        }
    } catch (error) {
        console.error('받은편지함 접속 오류:', error);
        showNotification('❌ 서버 연결 오류가 발생했습니다.', 'error');
    } finally {
        // 버튼 상태 복원
        const accessBtn = document.getElementById('accessInboxBtn');
        accessBtn.innerHTML = originalText;
        accessBtn.disabled = false;
    }
}

// 모달 표시 함수
function showModal() {
    const modal = document.getElementById('emailModal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // 스크롤 방지
}

// 모달 닫기 함수
function closeModal() {
    const modal = document.getElementById('emailModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // 스크롤 복원
}

// 클립보드에 복사 함수
async function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    const text = element.value;
    
    try {
        await navigator.clipboard.writeText(text);
        showNotification('✅ 클립보드에 복사되었습니다!', 'success');
        
        // 복사 버튼에 체크 표시
        const copyBtn = element.parentElement.querySelector('.copy-btn');
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="fas fa-check"></i> 복사됨';
        copyBtn.style.background = '#28a745';
        
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
            copyBtn.style.background = '#28a745';
        }, 2000);
    } catch (err) {
        console.error('클립보드 복사 실패:', err);
        showNotification('❌ 클립보드 복사에 실패했습니다.', 'error');
    }
}

// 알림 표시 함수
function showNotification(message, type = 'info') {
    // 기존 알림 제거
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // 새 알림 생성
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            z-index: 1000;
            font-weight: 500;
            max-width: 300px;
            animation: slideInRight 0.3s ease-out;
        ">
            ${message}
        </div>
    `;

    // CSS 애니메이션 추가
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // 3초 후 자동 제거
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    console.log('익명 이메일 플랫폼이 로드되었습니다.');
    
    // 이벤트 리스너 설정
    setupEventListeners();
});

// 이벤트 리스너 설정 함수
function setupEventListeners() {
    // 새 이메일 생성 버튼
    const generateBtn = document.querySelector('.btn');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateEmail);
    }
    
    // 받은편지함 접속 버튼
    const accessBtn = document.getElementById('accessInboxBtn');
    if (accessBtn) {
        accessBtn.addEventListener('click', accessInbox);
    }
    
    // 모달 닫기 버튼
    const closeBtn = document.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    // 모달 외부 클릭 시 닫기
    const modal = document.getElementById('emailModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
    
    // 입력 필드에서 Enter 키 이벤트 처리
    const emailInput = document.getElementById('emailAddress');
    if (emailInput) {
        emailInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                accessInbox();
            }
        });
    }
    
    const accessKeyInput = document.getElementById('accessKeyInput');
    if (accessKeyInput) {
        accessKeyInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                accessInbox();
            }
        });
    }
}
