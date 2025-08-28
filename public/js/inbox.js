// 영구 익명 이메일 플랫폼 - 받은편지함 JavaScript

// 전역 변수
let currentEmails = [];
let filteredEmails = [];
let currentFilters = {
    search: '',
    status: '',
    dateSort: 'newest'
};
let selectedEmails = new Set();

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    initializeInbox();
    setupEventListeners();
});

// 받은편지함 초기화
function initializeInbox() {
    // URL에서 이메일과 접근 키 가져오기
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    const accessKey = urlParams.get('accessKey');
    
    if (!email || !accessKey) {
        showNotification('❌ 잘못된 접근입니다. 홈으로 돌아가세요.', 'error');
        setTimeout(() => window.location.href = '/', 2000);
        return;
    }
    
    // 이메일 목록 로드
    loadEmails(email, accessKey);
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 검색 입력
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
    
    // 전체 선택 체크박스
    const selectAll = document.getElementById('selectAll');
    if (selectAll) {
        selectAll.addEventListener('change', handleSelectAll);
    }
    
    // 필터 변경
    const statusFilter = document.getElementById('statusFilter');
    const dateSort = document.getElementById('dateSort');
    
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);
    if (dateSort) dateSort.addEventListener('change', applyFilters);
    
    // 새로고침 버튼
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', handleRefresh);
    
    // 툴바 버튼들
    const markReadBtn = document.getElementById('markReadBtn');
    const markUnreadBtn = document.getElementById('markUnreadBtn');
    const starBtn = document.getElementById('starBtn');
    
    if (markReadBtn) markReadBtn.addEventListener('click', () => markSelectedAsRead());
    if (markUnreadBtn) markUnreadBtn.addEventListener('click', () => markSelectedAsUnread());
    if (starBtn) starBtn.addEventListener('click', () => toggleSelectedStars());
    
    // 키보드 단축키
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// 이메일 목록 로드
async function loadEmails(email, accessKey) {
    try {
        showLoading(true);
        
        const response = await fetch(`/api/inbox/${encodeURIComponent(email)}?accessKey=${encodeURIComponent(accessKey)}`);
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                currentEmails = data.data.emails || [];
                filteredEmails = [...currentEmails];
                renderEmailList();
                updateCounts();
                updatePagination();
                updateToolbarActions();
            } else {
                showNotification(`❌ 오류: ${data.error}`, 'error');
            }
        } else {
            const errorData = await response.json();
            showNotification(`❌ 오류: ${errorData.error}`, 'error');
        }
    } catch (error) {
        console.error('이메일 로드 오류:', error);
        showNotification('❌ 서버 연결 오류가 발생했습니다.', 'error');
    } finally {
        showLoading(false);
    }
}

// 이메일 목록 렌더링
function renderEmailList() {
    const emailList = document.getElementById('emailList');
    const noEmails = document.getElementById('noEmails');
    
    if (!emailList) return;
    
    // 기존 이메일 아이템 제거
    const existingItems = emailList.querySelectorAll('.email-item');
    existingItems.forEach(item => item.remove());
    
    if (filteredEmails.length === 0) {
        if (noEmails) noEmails.style.display = 'block';
        return;
    }
    
    if (noEmails) noEmails.style.display = 'none';
    
    // 이메일 아이템 생성
    filteredEmails.forEach((email, index) => {
        const emailItem = createEmailItem(email, index);
        emailList.appendChild(emailItem);
    });
}

// 이메일 아이템 생성
function createEmailItem(email, index) {
    const emailItem = document.createElement('div');
    emailItem.className = `email-item ${email.is_read ? 'read' : 'unread'}`;
    emailItem.dataset.emailId = email.id;
    
    // 체크박스
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'email-checkbox';
    checkbox.checked = selectedEmails.has(email.id);
    checkbox.addEventListener('change', (e) => {
        e.stopPropagation();
        handleEmailSelection(email.id, checkbox.checked);
    });
    
    // 별표
    const star = document.createElement('i');
    star.className = `email-star fas fa-star ${email.is_starred ? 'filled' : ''}`;
    star.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleStar(email.id);
    });
    
    // 이메일 내용
    const content = document.createElement('div');
    content.className = 'email-content';
    
    const sender = document.createElement('div');
    sender.className = 'email-sender';
    sender.textContent = email.sender || '발신자 없음';
    
    const subject = document.createElement('div');
    subject.className = 'email-subject';
    subject.textContent = email.subject || '제목 없음';
    
    const preview = document.createElement('div');
    preview.className = 'email-preview';
    preview.textContent = email.body ? email.body.substring(0, 100) + '...' : '내용 없음';
    
    content.appendChild(sender);
    content.appendChild(subject);
    content.appendChild(preview);
    
    // 첨부파일 아이콘
    const attachment = document.createElement('i');
    attachment.className = 'fas fa-paperclip email-attachment';
    attachment.style.display = email.has_attachments ? 'inline' : 'none';
    
    // 날짜
    const date = document.createElement('div');
    date.className = 'email-date';
    date.textContent = formatDate(email.received_at || email.created_at);
    
    // 새 메일 배지
    const newBadge = document.createElement('span');
    newBadge.className = 'email-badge';
    newBadge.textContent = '신규';
    newBadge.style.display = !email.is_read ? 'inline' : 'none';
    
    // 요소들을 이메일 아이템에 추가
    emailItem.appendChild(checkbox);
    emailItem.appendChild(star);
    emailItem.appendChild(content);
    emailItem.appendChild(attachment);
    emailItem.appendChild(date);
    emailItem.appendChild(newBadge);
    
    // 이메일 클릭 시 상세 보기
    emailItem.addEventListener('click', (e) => {
        if (!e.target.closest('input, i')) {
            showEmailDetail(email);
        }
    });
    
    // 더블클릭 시 상세 보기
    emailItem.addEventListener('dblclick', () => {
        showEmailDetail(email);
    });
    
    return emailItem;
}

// 이메일 선택 처리
function handleEmailSelection(emailId, isSelected) {
    if (isSelected) {
        selectedEmails.add(emailId);
    } else {
        selectedEmails.delete(emailId);
    }
    
    updateSelectAllState();
    updateToolbarActions();
}

// 전체 선택 처리
function handleSelectAll() {
    const selectAll = document.getElementById('selectAll');
    const checkboxes = document.querySelectorAll('.email-checkbox');
    
    checkboxes.forEach(checkbox => {
        const emailId = checkbox.closest('.email-item').dataset.emailId;
        checkbox.checked = selectAll.checked;
        
        if (selectAll.checked) {
            selectedEmails.add(emailId);
        } else {
            selectedEmails.delete(emailId);
        }
    });
    
    updateToolbarActions();
}

// 전체 선택 상태 업데이트
function updateSelectAllState() {
    const selectAll = document.getElementById('selectAll');
    const checkboxes = document.querySelectorAll('.email-checkbox');
    
    if (checkboxes.length === 0) return;
    
    const checkedCount = selectedEmails.size;
    const totalCount = checkboxes.length;
    
    if (checkedCount === 0) {
        selectAll.checked = false;
        selectAll.indeterminate = false;
    } else if (checkedCount === totalCount) {
        selectAll.checked = true;
        selectAll.indeterminate = false;
    } else {
        selectAll.checked = false;
        selectAll.indeterminate = true;
    }
}

// 툴바 액션 업데이트
function updateToolbarActions() {
    const hasSelection = selectedEmails.size > 0;
    const markReadBtn = document.getElementById('markReadBtn');
    const markUnreadBtn = document.getElementById('markUnreadBtn');
    const starBtn = document.getElementById('starBtn');
    
    if (markReadBtn) markReadBtn.disabled = !hasSelection;
    if (markUnreadBtn) markUnreadBtn.disabled = !hasSelection;
    if (starBtn) starBtn.disabled = !hasSelection;
}

// 선택된 이메일 읽음 표시
function markSelectedAsRead() {
    selectedEmails.forEach(emailId => {
        const email = currentEmails.find(e => e.id === emailId);
        if (email && !email.is_read) {
            email.is_read = true;
        }
    });
    
    renderEmailList();
    updateCounts();
    updateToolbarActions();
    showNotification('✅ 선택된 이메일을 읽음으로 표시했습니다.', 'success');
}

// 선택된 이메일 읽지 않음 표시
function markSelectedAsUnread() {
    selectedEmails.forEach(emailId => {
        const email = currentEmails.find(e => e.id === emailId);
        if (email && email.is_read) {
            email.is_read = false;
        }
    });
    
    renderEmailList();
    updateCounts();
    updateToolbarActions();
    showNotification('✅ 선택된 이메일을 읽지 않음으로 표시했습니다.', 'success');
}

// 선택된 이메일 별표 토글
function toggleSelectedStars() {
    const hasStarred = Array.from(selectedEmails).some(emailId => {
        const email = currentEmails.find(e => e.id === emailId);
        return email && email.is_starred;
    });
    
    selectedEmails.forEach(emailId => {
        const email = currentEmails.find(e => e.id === emailId);
        if (email) {
            email.is_starred = !hasStarred;
        }
    });
    
    renderEmailList();
    updateCounts();
    updateToolbarActions();
    
    const action = hasStarred ? '제거' : '추가';
    showNotification(`✅ 선택된 이메일의 별표를 ${action}했습니다.`, 'success');
}

// 별표 토글
function toggleStar(emailId) {
    const email = currentEmails.find(e => e.id === emailId);
    if (email) {
        email.is_starred = !email.is_starred;
        renderEmailList();
        updateCounts();
        showNotification(`✅ ${email.is_starred ? '별표 추가' : '별표 제거'}되었습니다.`, 'success');
    }
}

// 검색 처리
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    currentFilters.search = searchTerm;
    applyFilters();
}

// 필터 적용
function applyFilters() {
    const statusFilter = document.getElementById('statusFilter');
    const dateSort = document.getElementById('dateSort');
    
    if (statusFilter) currentFilters.status = statusFilter.value;
    if (dateSort) currentFilters.dateSort = dateSort.value;
    
    // 필터링
    filteredEmails = currentEmails.filter(email => {
        // 검색 필터
        if (currentFilters.search) {
            const searchText = `${email.subject || ''} ${email.sender || ''} ${email.body || ''}`.toLowerCase();
            if (!searchText.includes(currentFilters.search)) return false;
        }
        
        // 상태 필터
        if (currentFilters.status === 'unread' && email.is_read) return false;
        if (currentFilters.status === 'read' && !email.is_read) return false;
        
        return true;
    });
    
    // 정렬
    if (currentFilters.dateSort === 'newest') {
        filteredEmails.sort((a, b) => new Date(b.received_at || b.created_at) - new Date(a.received_at || a.created_at));
    } else {
        filteredEmails.sort((a, b) => new Date(a.received_at || a.created_at) - new Date(b.received_at || b.created_at));
    }
    
    renderEmailList();
    updateCounts();
    updatePagination();
}

// 카운트 업데이트
function updateCounts() {
    const totalCount = document.getElementById('totalCount');
    const unreadCount = document.getElementById('unreadCount');
    const starredCount = document.getElementById('starredCount');
    const todayCount = document.getElementById('todayCount');
    
    if (totalCount) totalCount.textContent = filteredEmails.length;
    
    const unreadEmails = filteredEmails.filter(email => !email.is_read);
    if (unreadCount) unreadCount.textContent = unreadEmails.length;
    
    const starredEmails = filteredEmails.filter(email => email.is_starred);
    if (starredCount) starredCount.textContent = starredEmails.length;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEmails = filteredEmails.filter(email => {
        const emailDate = new Date(email.received_at || email.created_at);
        emailDate.setHours(0, 0, 0, 0);
        return emailDate.getTime() === today.getTime();
    });
    if (todayCount) todayCount.textContent = todayEmails.length;
}

// 페이지네이션 업데이트
function updatePagination() {
    const paginationInfo = document.getElementById('paginationInfo');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (paginationInfo) {
        paginationInfo.textContent = `${filteredEmails.length}개 중 1-${Math.min(filteredEmails.length, 50)}`;
    }
    
    if (prevBtn) prevBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = filteredEmails.length <= 50;
}

// 새로고침 처리
function handleRefresh() {
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    const accessKey = urlParams.get('accessKey');
    
    if (email && accessKey) {
        loadEmails(email, accessKey);
        showNotification('✅ 새로고침되었습니다.', 'success');
    }
}

// 이메일 상세 보기
function showEmailDetail(email) {
    const modal = document.getElementById('emailModal');
    const emailDetail = document.getElementById('emailDetail');
    
    if (!modal || !emailDetail) return;
    
    emailDetail.innerHTML = `
        <div class="input-group">
            <label><strong>제목:</strong></label>
            <div class="input-field" style="background: #f8f9fa; color: #333;">${email.subject || '제목 없음'}</div>
        </div>
        
        <div class="input-group">
            <label><strong>발신자:</strong></label>
            <div class="input-field" style="background: #f8f9fa; color: #333;">${email.sender || '알 수 없음'}</div>
        </div>
        
        <div class="input-group">
            <label><strong>수신일:</strong></label>
            <div class="input-field" style="background: #f8f9fa; color: #333;">${formatDate(email.received_at || email.created_at)}</div>
        </div>
        
        <div class="input-group">
            <label><strong>내용:</strong></label>
            <div class="input-field" style="background: #f8f9fa; color: #333; min-height: 200px; white-space: pre-wrap;">${email.body || '내용이 없습니다.'}</div>
        </div>
    `;
    
    modal.style.display = 'block';
    
    // 읽음 상태로 변경
    if (!email.is_read) {
        email.is_read = true;
        renderEmailList();
        updateCounts();
    }
}

// 모달 닫기
function closeEmailModal() {
    const modal = document.getElementById('emailModal');
    if (modal) modal.style.display = 'none';
}

// 키보드 단축키 처리
function handleKeyboardShortcuts(event) {
    // Ctrl + F: 검색
    if (event.ctrlKey && event.key === 'f') {
        event.preventDefault();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.focus();
    }
    
    // Ctrl + R: 새로고침
    if (event.ctrlKey && event.key === 'r') {
        event.preventDefault();
        handleRefresh();
    }
    
    // Esc: 모달 닫기
    if (event.key === 'Escape') {
        closeEmailModal();
    }
    
    // 스페이스바: 이메일 선택
    if (event.key === ' ' && document.activeElement.classList.contains('email-item')) {
        event.preventDefault();
        const emailId = document.activeElement.dataset.emailId;
        const checkbox = document.activeElement.querySelector('.email-checkbox');
        if (checkbox) {
            checkbox.checked = !checkbox.checked;
            handleEmailSelection(emailId, checkbox.checked);
        }
    }
}

// 로딩 표시/숨김
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.style.display = show ? 'block' : 'none';
    }
}

// 알림 표시 (홈화면과 동일한 스타일)
function showNotification(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;
    
    const toast = document.createElement('div');
    toast.className = 'card';
    toast.style.margin = '0.5rem 0';
    toast.style.animation = 'fadeInUp 0.4s ease-out';
    
    let iconClass = 'fas fa-info-circle';
    let iconColor = '#667eea';
    
    if (type === 'success') {
        iconClass = 'fas fa-check-circle';
        iconColor = '#28a745';
    } else if (type === 'error') {
        iconClass = 'fas fa-exclamation-circle';
        iconColor = '#dc3545';
    } else if (type === 'warning') {
        iconClass = 'fas fa-exclamation-triangle';
        iconColor = '#ffc107';
    }
    
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            <i class="${iconClass}" style="color: ${iconColor}; font-size: 1.2rem;"></i>
            <span style="flex: 1; color: #333;">${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: #999; cursor: pointer; font-size: 1.2rem;">&times;</button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // 5초 후 자동 제거
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}

// 날짜 포맷팅
function formatDate(dateString) {
    if (!dateString) return '날짜 없음';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        // 오늘
        const hours = date.getHours();
        if (hours < 12) {
            return `오전 ${hours}시`;
        } else if (hours === 12) {
            return '오후 12시';
        } else {
            return `오후 ${hours - 12}시`;
        }
    } else if (diffDays === 1) {
        return '어제';
    } else if (diffDays < 7) {
        return `${diffDays}일 전`;
    } else {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${month}월 ${day}일`;
    }
}

// 디바운스 함수
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 전역 함수로 노출 (HTML에서 호출)
window.closeEmailModal = closeEmailModal;
