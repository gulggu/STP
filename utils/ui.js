/**
 * ST-LifeSim 공통 UI 유틸리티
 * 토스트 알림, 다이얼로그 등 공통 UI 요소
 */

/**
 * UI 시스템 초기화
 */
export function initializeUI() {
    console.log('[ST-LifeSim UI] UI system initialized');
    
    // 전역 객체에 UI 함수 노출
    window.lifesimUI = {
        showToast,
        showLoading,
        hideLoading
    };
}

/**
 * 토스트 알림 표시
 * @param {string} message - 메시지
 * @param {string} type - 타입 ('success', 'error', 'info', 'warning')
 * @param {number} duration - 표시 시간 (ms, 기본값: 3000)
 */
export function showToast(message, type = 'info', duration = 3000) {
    // 기존 토스트 제거
    const existingToasts = document.querySelectorAll('.lifesim-toast');
    existingToasts.forEach(toast => toast.remove());
    
    // 토스트 생성
    const toast = document.createElement('div');
    toast.className = `lifesim-toast ${type}`;
    
    // 아이콘 추가
    let icon = '';
    switch (type) {
        case 'success':
            icon = '✓';
            break;
        case 'error':
            icon = '✗';
            break;
        case 'warning':
            icon = '⚠';
            break;
        case 'info':
        default:
            icon = 'ℹ';
            break;
    }
    
    toast.innerHTML = `<strong>${icon}</strong> ${message}`;
    
    // DOM에 추가
    document.body.appendChild(toast);
    
    // 자동 제거
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, duration);
}

/**
 * 로딩 오버레이 표시
 * @param {string} message - 로딩 메시지 (선택)
 */
export function showLoading(message = '처리 중...') {
    // 기존 로딩 제거
    hideLoading();
    
    const overlay = document.createElement('div');
    overlay.className = 'lifesim-overlay';
    overlay.id = 'lifesim-loading-overlay';
    
    const loadingBox = document.createElement('div');
    loadingBox.className = 'lifesim-loading-box';
    loadingBox.innerHTML = `
        <div class="lifesim-spinner"></div>
        <p>${message}</p>
    `;
    
    overlay.appendChild(loadingBox);
    document.body.appendChild(overlay);
}

/**
 * 로딩 오버레이 숨기기
 */
export function hideLoading() {
    const overlay = document.getElementById('lifesim-loading-overlay');
    if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
    }
}

/**
 * 프로그레스 바 생성
 * @param {number} value - 현재 값 (0-100)
 * @param {string} label - 레이블 (선택)
 * @returns {HTMLElement}
 */
export function createProgressBar(value, label = '') {
    const container = document.createElement('div');
    container.className = 'lifesim-progress-container';
    
    if (label) {
        const labelElement = document.createElement('div');
        labelElement.className = 'lifesim-progress-label';
        labelElement.textContent = label;
        container.appendChild(labelElement);
    }
    
    const bar = document.createElement('div');
    bar.className = 'lifesim-progress-bar';
    
    const fill = document.createElement('div');
    fill.className = 'lifesim-progress-fill';
    fill.style.width = `${Math.min(100, Math.max(0, value))}%`;
    
    bar.appendChild(fill);
    container.appendChild(bar);
    
    return container;
}

/**
 * 카드 생성
 * @param {Object} options - 카드 옵션
 * @param {string} options.title - 제목
 * @param {string} options.content - 내용
 * @param {Array<Object>} options.actions - 액션 버튼들 (선택)
 * @returns {HTMLElement}
 */
export function createCard(options) {
    const { title, content, actions = [] } = options;
    
    const card = document.createElement('div');
    card.className = 'lifesim-card';
    
    if (title) {
        const titleElement = document.createElement('h4');
        titleElement.textContent = title;
        card.appendChild(titleElement);
    }
    
    if (content) {
        const contentElement = document.createElement('div');
        contentElement.className = 'lifesim-card-content';
        if (typeof content === 'string') {
            contentElement.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            contentElement.appendChild(content);
        }
        card.appendChild(contentElement);
    }
    
    if (actions.length > 0) {
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'lifesim-card-actions';
        
        actions.forEach(action => {
            const btn = document.createElement('button');
            btn.className = `lifesim-btn ${action.className || ''}`;
            btn.textContent = action.text || '버튼';
            if (action.onClick) {
                btn.onclick = action.onClick;
            }
            actionsContainer.appendChild(btn);
        });
        
        card.appendChild(actionsContainer);
    }
    
    return card;
}

/**
 * 배지 생성
 * @param {string} text - 배지 텍스트
 * @param {string} type - 타입 ('primary', 'success', 'warning', 'danger', 'info')
 * @returns {HTMLElement}
 */
export function createBadge(text, type = 'primary') {
    const badge = document.createElement('span');
    badge.className = `lifesim-badge lifesim-badge-${type}`;
    badge.textContent = text;
    return badge;
}

/**
 * 아바타 이미지 생성
 * @param {string} url - 이미지 URL
 * @param {string} name - 이름 (alt 텍스트용)
 * @param {string} size - 크기 ('small', 'medium', 'large')
 * @returns {HTMLElement}
 */
export function createAvatar(url, name, size = 'medium') {
    const avatar = document.createElement('div');
    avatar.className = `lifesim-avatar lifesim-avatar-${size}`;
    
    if (url) {
        const img = document.createElement('img');
        img.src = url;
        img.alt = name;
        avatar.appendChild(img);
    } else {
        // URL이 없으면 이니셜 표시
        const initial = name ? name.charAt(0).toUpperCase() : '?';
        avatar.textContent = initial;
        avatar.style.backgroundColor = stringToColor(name);
    }
    
    return avatar;
}

/**
 * 문자열을 색상으로 변환 (일관된 아바타 색상 생성용)
 * @param {string} str - 문자열
 * @returns {string} 색상 코드
 */
function stringToColor(str) {
    if (!str) return '#666';
    
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const hue = hash % 360;
    return `hsl(${hue}, 50%, 50%)`;
}

/**
 * 검색 입력 필드 생성
 * @param {string} placeholder - 플레이스홀더 텍스트
 * @param {Function} onSearch - 검색 콜백
 * @returns {HTMLElement}
 */
export function createSearchInput(placeholder, onSearch) {
    const container = document.createElement('div');
    container.className = 'lifesim-search-container';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'lifesim-input';
    input.placeholder = placeholder || '🔍 검색...';
    
    let debounceTimer;
    input.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            if (onSearch) {
                onSearch(e.target.value);
            }
        }, 300);
    });
    
    container.appendChild(input);
    return container;
}

/**
 * 빈 상태 메시지 생성
 * @param {string} message - 메시지
 * @param {string} icon - 아이콘 (선택)
 * @returns {HTMLElement}
 */
export function createEmptyState(message, icon = '📭') {
    const container = document.createElement('div');
    container.className = 'lifesim-empty-state';
    container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #999;">
            <div style="font-size: 48px; margin-bottom: 10px;">${icon}</div>
            <p>${message}</p>
        </div>
    `;
    return container;
}

// CSS 추가 (style.css에 나중에 추가할 스타일들)
const additionalStyles = `
.lifesim-loading-box {
    background: var(--SmartThemeBodyColor, #2a2a2a);
    border: 1px solid var(--SmartThemeBorderColor, #333);
    border-radius: 10px;
    padding: 30px 40px;
    text-align: center;
}

.lifesim-spinner {
    width: 40px;
    height: 40px;
    margin: 0 auto 15px;
    border: 4px solid rgba(255, 255, 255, 0.1);
    border-top-color: var(--SmartThemeQuoteColor, #4a9eff);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

@keyframes slideOutRight {
    to {
        transform: translateX(100%);
        opacity: 0;
    }
}

.lifesim-progress-container {
    margin: 10px 0;
}

.lifesim-progress-label {
    margin-bottom: 5px;
    font-size: 14px;
}

.lifesim-progress-bar {
    width: 100%;
    height: 20px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 10px;
    overflow: hidden;
}

.lifesim-progress-fill {
    height: 100%;
    background: var(--SmartThemeQuoteColor, #4a9eff);
    transition: width 0.3s ease;
}

.lifesim-card-content {
    margin: 10px 0;
}

.lifesim-card-actions {
    display: flex;
    gap: 10px;
    margin-top: 15px;
}

.lifesim-badge {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
}

.lifesim-badge-primary { background: #4a9eff; color: white; }
.lifesim-badge-success { background: #28a745; color: white; }
.lifesim-badge-warning { background: #ffc107; color: black; }
.lifesim-badge-danger { background: #dc3545; color: white; }
.lifesim-badge-info { background: #17a2b8; color: white; }

.lifesim-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    overflow: hidden;
    background: #666;
    color: white;
    font-weight: bold;
}

.lifesim-avatar-small { width: 32px; height: 32px; font-size: 14px; }
.lifesim-avatar-medium { width: 48px; height: 48px; font-size: 18px; }
.lifesim-avatar-large { width: 64px; height: 64px; font-size: 24px; }

.lifesim-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.lifesim-search-container {
    position: relative;
    margin-bottom: 15px;
}

.lifesim-empty-state {
    padding: 20px;
}
`;

// 스타일 주입
if (typeof document !== 'undefined') {
    const styleElement = document.createElement('style');
    styleElement.textContent = additionalStyles;
    document.head.appendChild(styleElement);
}
