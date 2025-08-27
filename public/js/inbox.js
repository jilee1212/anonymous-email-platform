// 받은편지함 페이지 JavaScript
let currentEmail = '';
let currentAccessKey = '';

document.addEventListener('DOMContentLoaded', function() {
    // URL 파라미터에서 이메일과 접근 키 가져오기
    const urlParams = new URLSearchParams(window.location.search);
    currentEmail = urlParams.get('email');
    currentAccessKey = urlParams.get('accessKey');
    
    if (!currentEmail || !currentAccessKey) {
        showError('이메일 주소와 접근 키가 필요합니다.');
        return;
    }
    
    // 페이지 초기화
    initializePage();
    
    // 새로고침 버튼 이벤트
    document.getElementById('refreshBtn').addEventListener('click', loadEmails);
    
    // 이메일 목록 로드
    loadEmails();
});

// 페이지 초기화
function initializePage() {
    // 헤더에 이메일 정보 표시
    document.getElementById('currentEmail').textContent = currentEmail;
    document.getElementById('emailInfo').textContent = `현재 접속 중: ${currentEmail}`;
    
    // 마지막 접속 시간 표시
    const now = new Date();
    document.getElementById('lastAccess').textContent = `마지막 접속: ${formatDateTime(now)}`;
}

// 이메일 목록 로드
async function loadEmails() {
    try {
        showLoading(true);
        
        const response = await fetch(`/api/inbox/${encodeURIComponent(currentEmail)}?accessKey=${encodeURIComponent(currentAccessKey)}`);
        const result = await response.json();
        
        if (result.success) {
            displayEmails(result.data.emails);
            updateCounts(result.data.totalCount, result.data.emails.filter(email => !email.is_read).length);
        } else {
            showError(result.error || '받은편지함을 불러올 수 없습니다.');
        }
    } catch (error) {
        console.error('이메일 로드 오류:', error);
        showError('서버 연결 오류가 발생했습니다.');
    } finally {
        showLoading(false);
    }
}

// 이메일 목록 표시
function displayEmails(emails) {
    const emailList = document.getElementById('emailList');
    const noEmails = document.getElementById('noEmails');
    
    if (emails.length === 0) {
        noEmails.classList.remove('hidden');
        return;
    }
    
    noEmails.classList.add('hidden');
    
    // 기존 이메일 목록 제거
    const existingEmails = emailList.querySelectorAll('.email-item');
    existingEmails.forEach(email => email.remove());
    
    // 이메일 목록 생성
    emails.forEach(email => {
        const emailElement = createEmailElement(email);
        emailList.appendChild(emailElement);
    });
}

// 이메일 요소 생성
function createEmailElement(email) {
    const emailDiv = document.createElement('div');
    emailDiv.className = `email-item p-4 cursor-pointer ${email.is_read ? 'read' : 'unread'}`;
    
    const receivedDate = new Date(email.received_at);
    const formattedDate = formatDateTime(receivedDate);
    
    emailDiv.innerHTML = `
        <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
                <div class="flex items-center mb-2">
                    <span class="font-medium text-gray-900 truncate mr-2">
                        ${escapeHtml(email.sender || '알 수 없는 발신자')}
                    </span>
                    ${!email.is_read ? '<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">새 메일</span>' : ''}
                </div>
                <h4 class="text-sm font-semibold text-gray-800 mb-1 truncate">
                    ${escapeHtml(email.subject || '(제목 없음)')}
                </h4>
                <p class="text-sm text-gray-600 line-clamp-2">
                    ${escapeHtml(email.body || '(내용 없음)')}
                </p>
                <div class="flex items-center mt-2 text-xs text-gray-500">
                    <i class="fas fa-clock mr-1"></i>
                    <span>${formattedDate}</span>
                </div>
            </div>
            <div class="ml-4 flex-shrink-0">
                <button onclick="openEmailDetail('${email.id}')" class="text-blue-600 hover:text-blue-800">
                    <i class="fas fa-eye"></i>
                </button>
            </div>
        </div>
    `;
    
    // 이메일 클릭 시 상세 보기
    emailDiv.addEventListener('click', function(e) {
        if (!e.target.closest('button')) {
            openEmailDetail(email.id);
        }
    });
    
    return emailDiv;
}

// 이메일 상세 보기
async function openEmailDetail(emailId) {
    try {
        showLoading(true);
        
        const response = await fetch(`/api/inbox/${encodeURIComponent(currentEmail)}?accessKey=${encodeURIComponent(currentAccessKey)}`);
        const result = await response.json();
        
        if (result.success) {
            const email = result.data.emails.find(e => e.id == emailId);
            if (email) {
                displayEmailDetail(email);
                showEmailModal();
            } else {
                showError('이메일을 찾을 수 없습니다.');
            }
        } else {
            showError(result.error || '이메일을 불러올 수 없습니다.');
        }
    } catch (error) {
        console.error('이메일 상세 로드 오류:', error);
        showError('서버 연결 오류가 발생했습니다.');
    } finally {
        showLoading(false);
    }
}

// 이메일 상세 내용 표시
function displayEmailDetail(email) {
    const emailDetail = document.getElementById('emailDetail');
    const receivedDate = new Date(email.received_at);
    const formattedDate = formatDateTime(receivedDate);
    
    emailDetail.innerHTML = `
        <div class="space-y-4">
            <div class="border-b border-gray-200 pb-4">
                <h2 class="text-xl font-bold text-gray-800 mb-2">
                    ${escapeHtml(email.subject || '(제목 없음)')}
                </h2>
                <div class="flex items-center justify-between text-sm text-gray-600">
                    <span><strong>발신자:</strong> ${escapeHtml(email.sender || '알 수 없는 발신자')}</span>
                    <span><strong>수신 시간:</strong> ${formattedDate}</span>
                </div>
            </div>
            
            <div class="prose max-w-none">
                <div class="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    ${escapeHtml(email.body || '(내용 없음)')}
                </div>
            </div>
            
            <div class="border-t border-gray-200 pt-4">
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-500">
                        이메일 ID: ${email.id}
                    </span>
                    <button onclick="markAsRead('${email.id}')" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition duration-200">
                        <i class="fas fa-check mr-2"></i>
                        읽음으로 표시
                    </button>
                </div>
            </div>
        </div>
    `;
}

// 이메일을 읽음으로 표시
async function markAsRead(emailId) {
    try {
        // 여기서는 간단하게 프론트엔드에서만 처리
        // 실제로는 API를 통해 서버에 읽음 상태를 업데이트해야 함
        const emailElement = document.querySelector(`[onclick="openEmailDetail('${emailId}')"]`);
        if (emailElement) {
            emailElement.closest('.email-item').classList.remove('unread');
            emailElement.closest('.email-item').classList.add('read');
            
            // 새 메일 배지 제거
            const badge = emailElement.closest('.email-item').querySelector('.bg-blue-100');
            if (badge) {
                badge.remove();
            }
            
            // 카운트 업데이트
            const unreadCount = document.getElementById('unreadCount');
            const currentCount = parseInt(unreadCount.textContent);
            if (currentCount > 0) {
                unreadCount.textContent = currentCount - 1;
            }
        }
        
        showNotification('읽음으로 표시되었습니다.', 'success');
    } catch (error) {
        console.error('읽음 표시 오류:', error);
        showNotification('읽음 표시에 실패했습니다.', 'error');
    }
}

// 이메일 모달 표시
function showEmailModal() {
    document.getElementById('emailModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// 이메일 모달 닫기
function closeEmailModal() {
    document.getElementById('emailModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// 모달 외부 클릭 시 닫기
document.getElementById('emailModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeEmailModal();
    }
});

// ESC 키로 모달 닫기
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeEmailModal();
    }
});

// 카운트 업데이트
function updateCounts(totalCount, unreadCount) {
    document.getElementById('totalCount').textContent = totalCount;
    document.getElementById('unreadCount').textContent = unreadCount;
}

// 로딩 스피너 표시/숨김
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (show) {
        spinner.classList.remove('hidden');
    } else {
        spinner.classList.add('hidden');
    }
}

// 에러 메시지 표시
function showError(message) {
    showNotification(message, 'error');
}

// 알림 메시지 표시
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

// HTML 이스케이프
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 날짜/시간 포맷팅
function formatDateTime(date) {
    const now = new Date();
    const diff = now - date;
    const diffMinutes = Math.floor(diff / (1000 * 60));
    const diffHours = Math.floor(diff / (1000 * 60 * 60));
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) {
        return '방금 전';
    } else if (diffMinutes < 60) {
        return `${diffMinutes}분 전`;
    } else if (diffHours < 24) {
        return `${diffHours}시간 전`;
    } else if (diffDays < 7) {
        return `${diffDays}일 전`;
    } else {
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}
