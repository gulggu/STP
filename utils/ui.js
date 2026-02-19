/* ============================================================================
 * ui.js - 공통 UI 유틸리티
 * ============================================================================
 * 토스트 알림, 로딩 스피너 등 범용 UI 컴포넌트
 * ========================================================================== */

/**
 * 토스트 알림 표시
 * @param {string} message - 알림 메시지
 * @param {string} type - 'success', 'error', 'warning', 'info' 중 하나
 * @param {number} duration - 표시 시간 (ms, 기본: 3000)
 */
export function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `stls-toast ${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'stls-fadeOut 0.3s ease';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, duration);
}

/**
 * 성공 토스트
 * @param {string} message - 메시지
 */
export function showSuccess(message) {
    showToast(message, 'success');
}

/**
 * 오류 토스트
 * @param {string} message - 메시지
 */
export function showError(message) {
    showToast(message, 'error');
}

/**
 * 경고 토스트
 * @param {string} message - 메시지
 */
export function showWarning(message) {
    showToast(message, 'warning');
}

/**
 * 정보 토스트
 * @param {string} message - 메시지
 */
export function showInfo(message) {
    showToast(message, 'info');
}

/**
 * 로딩 오버레이 표시
 * @param {string} message - 로딩 메시지 (선택)
 * @returns {Function} 로딩 종료 함수
 */
export function showLoading(message = '처리 중...') {
    const overlay = document.createElement('div');
    overlay.className = 'stls-overlay';
    overlay.style.cursor = 'wait';
    
    const spinner = document.createElement('div');
    spinner.style.cssText = `
        background: rgba(0, 0, 0, 0.8);
        padding: 30px 40px;
        border-radius: 12px;
        text-align: center;
        color: white;
    `;
    
    spinner.innerHTML = `
        <div style="margin-bottom: 10px; font-size: 32px;">⏳</div>
        <div>${message}</div>
    `;
    
    overlay.appendChild(spinner);
    document.body.appendChild(overlay);
    
    return () => {
        overlay.classList.add('closing');
        setTimeout(() => overlay.remove(), 200);
    };
}

/**
 * 드롭다운 메뉴 생성 및 표시
 * @param {Array<Object>} items - 메뉴 항목 [{text, icon, onClick}]
 * @param {number} x - X 좌표
 * @param {number} y - Y 좌표
 * @returns {Function} 드롭다운 닫기 함수
 */
export function showDropdown(items, x, y) {
    const dropdown = document.createElement('div');
    dropdown.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        background: rgba(0, 0, 0, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        padding: 8px 0;
        z-index: 10001;
        min-width: 150px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    `;
    
    items.forEach(item => {
        const menuItem = document.createElement('div');
        menuItem.style.cssText = `
            padding: 10px 16px;
            cursor: pointer;
            transition: background 0.2s;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        
        if (item.icon) {
            menuItem.innerHTML = `<span>${item.icon}</span><span>${item.text}</span>`;
        } else {
            menuItem.textContent = item.text;
        }
        
        menuItem.onmouseenter = () => {
            menuItem.style.background = 'rgba(255, 255, 255, 0.1)';
        };
        menuItem.onmouseleave = () => {
            menuItem.style.background = 'transparent';
        };
        menuItem.onclick = () => {
            if (item.onClick) {
                item.onClick();
            }
            closeDropdown();
        };
        
        dropdown.appendChild(menuItem);
    });
    
    document.body.appendChild(dropdown);
    
    function closeDropdown() {
        dropdown.remove();
        document.removeEventListener('click', handleOutsideClick);
    }
    
    function handleOutsideClick(e) {
        if (!dropdown.contains(e.target)) {
            closeDropdown();
        }
    }
    
    // 다음 프레임에 이벤트 리스너 등록 (현재 클릭 이벤트와 겹치지 않도록)
    setTimeout(() => {
        document.addEventListener('click', handleOutsideClick);
    }, 10);
    
    return closeDropdown;
}

/**
 * HTML 요소 생성 헬퍼
 * @param {string} tag - 태그명
 * @param {Object} attrs - 속성 객체
 * @param {Array|string|HTMLElement} children - 자식 요소
 * @returns {HTMLElement}
 */
export function createElement(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    
    Object.entries(attrs).forEach(([key, value]) => {
        if (key === 'className') {
            el.className = value;
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(el.style, value);
        } else if (key.startsWith('on') && typeof value === 'function') {
            el.addEventListener(key.substring(2).toLowerCase(), value);
        } else {
            el.setAttribute(key, value);
        }
    });
    
    if (typeof children === 'string') {
        el.textContent = children;
    } else if (children instanceof HTMLElement) {
        el.appendChild(children);
    } else if (Array.isArray(children)) {
        children.forEach(child => {
            if (typeof child === 'string') {
                el.appendChild(document.createTextNode(child));
            } else if (child instanceof HTMLElement) {
                el.appendChild(child);
            }
        });
    }
    
    return el;
}

/**
 * 탭 컴포넌트 생성
 * @param {Array<Object>} tabs - 탭 배열 [{id, label, content}]
 * @param {string} defaultTab - 기본 선택 탭 ID
 * @returns {HTMLElement} 탭 컨테이너 요소
 */
export function createTabs(tabs, defaultTab = null) {
    const container = createElement('div', { className: 'stls-tabs-container' });
    const tabsBar = createElement('div', { className: 'stls-tabs' });
    const contentArea = createElement('div', { className: 'stls-tabs-content' });
    
    const activeTabId = defaultTab || (tabs.length > 0 ? tabs[0].id : null);
    
    tabs.forEach(tab => {
        const tabBtn = createElement('button', {
            className: `stls-tab ${tab.id === activeTabId ? 'active' : ''}`,
            'data-tab': tab.id
        }, tab.label);
        
        tabBtn.onclick = () => {
            // 모든 탭 비활성화
            tabsBar.querySelectorAll('.stls-tab').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // 현재 탭 활성화
            tabBtn.classList.add('active');
            
            // 콘텐츠 교체
            contentArea.innerHTML = '';
            if (typeof tab.content === 'string') {
                contentArea.innerHTML = tab.content;
            } else if (tab.content instanceof HTMLElement) {
                contentArea.appendChild(tab.content);
            } else if (typeof tab.content === 'function') {
                const result = tab.content();
                if (typeof result === 'string') {
                    contentArea.innerHTML = result;
                } else if (result instanceof HTMLElement) {
                    contentArea.appendChild(result);
                }
            }
        };
        
        tabsBar.appendChild(tabBtn);
    });
    
    container.appendChild(tabsBar);
    container.appendChild(contentArea);
    
    // 초기 콘텐츠 표시
    const activeTab = tabs.find(t => t.id === activeTabId);
    if (activeTab) {
        if (typeof activeTab.content === 'string') {
            contentArea.innerHTML = activeTab.content;
        } else if (activeTab.content instanceof HTMLElement) {
            contentArea.appendChild(activeTab.content);
        } else if (typeof activeTab.content === 'function') {
            const result = activeTab.content();
            if (typeof result === 'string') {
                contentArea.innerHTML = result;
            } else if (result instanceof HTMLElement) {
                contentArea.appendChild(result);
            }
        }
    }
    
    return container;
}

export default {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    showDropdown,
    createElement,
    createTabs
};
