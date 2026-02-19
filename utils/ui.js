/* ===========================================
   ui.js - 토스트, 다이얼로그 등 공통 UI
   =========================================== */

/**
 * 토스트 알림 표시
 * @param {string} message - 표시할 메시지
 * @param {string} type - 'success', 'error', 'info' (기본값: 'info')
 * @param {number} duration - 표시 시간 (ms, 기본값: 3000)
 */
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `stls-toast ${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // 자동으로 제거
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, duration);
}

/**
 * 성공 토스트
 * @param {string} message - 메시지
 */
function showSuccess(message) {
    showToast(message, 'success');
}

/**
 * 에러 토스트
 * @param {string} message - 메시지
 */
function showError(message) {
    showToast(message, 'error');
}

/**
 * 정보 토스트
 * @param {string} message - 메시지
 */
function showInfo(message) {
    showToast(message, 'info');
}

/**
 * 로딩 스피너 표시/숨김
 * @param {boolean} show - 표시 여부
 */
let loadingOverlay = null;
function showLoading(show = true) {
    if (show) {
        if (!loadingOverlay) {
            loadingOverlay = document.createElement('div');
            loadingOverlay.className = 'stls-overlay';
            loadingOverlay.innerHTML = `
                <div style="text-align: center; color: white;">
                    <div style="font-size: 24px; margin-bottom: 10px;">⏳</div>
                    <div>처리 중...</div>
                </div>
            `;
            document.body.appendChild(loadingOverlay);
        }
    } else {
        if (loadingOverlay) {
            loadingOverlay.remove();
            loadingOverlay = null;
        }
    }
}

/**
 * 드롭다운 메뉴 생성
 * @param {Array} items - 메뉴 아이템 배열 [{text, onClick}]
 * @param {HTMLElement} anchorEl - 기준 엘리먼트
 * @returns {HTMLElement} 드롭다운 엘리먼트
 */
function createDropdown(items, anchorEl) {
    // 기존 드롭다운 제거
    const existing = document.querySelector('.stls-dropdown');
    if (existing) {
        existing.remove();
    }
    
    const dropdown = document.createElement('div');
    dropdown.className = 'stls-dropdown';
    dropdown.style.cssText = `
        position: absolute;
        background: var(--SmartThemeBodyColor, #2a2a2a);
        border: 1px solid var(--SmartThemeBorderColor, #333);
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        z-index: 10001;
        min-width: 150px;
    `;
    
    items.forEach(item => {
        const menuItem = document.createElement('div');
        menuItem.style.cssText = `
            padding: 10px 15px;
            cursor: pointer;
            color: var(--SmartThemeEmColor, #fff);
            transition: background 0.2s;
        `;
        menuItem.textContent = item.text;
        menuItem.addEventListener('mouseenter', () => {
            menuItem.style.background = 'var(--SmartThemeBlurTintColor, #3a3a3a)';
        });
        menuItem.addEventListener('mouseleave', () => {
            menuItem.style.background = 'transparent';
        });
        menuItem.addEventListener('click', () => {
            if (item.onClick) {
                item.onClick();
            }
            dropdown.remove();
        });
        dropdown.appendChild(menuItem);
    });
    
    // 위치 계산
    const rect = anchorEl.getBoundingClientRect();
    dropdown.style.top = `${rect.bottom + 5}px`;
    dropdown.style.left = `${rect.left}px`;
    
    document.body.appendChild(dropdown);
    
    // 외부 클릭으로 닫기
    const closeHandler = (e) => {
        if (!dropdown.contains(e.target) && e.target !== anchorEl) {
            dropdown.remove();
            document.removeEventListener('click', closeHandler);
        }
    };
    setTimeout(() => {
        document.addEventListener('click', closeHandler);
    }, 10);
    
    return dropdown;
}

/**
 * 탭 컴포넌트 생성
 * @param {Array} tabs - 탭 배열 [{id, label, content}]
 * @param {string} defaultTab - 기본 선택 탭 ID
 * @returns {HTMLElement} 탭 컨테이너
 */
function createTabs(tabs, defaultTab = null) {
    const container = document.createElement('div');
    
    // 탭 헤더
    const tabHeader = document.createElement('div');
    tabHeader.className = 'stls-tabs';
    
    // 탭 콘텐츠 컨테이너
    const tabContent = document.createElement('div');
    tabContent.className = 'stls-tab-content';
    
    const activeTabId = defaultTab || (tabs[0] && tabs[0].id);
    
    tabs.forEach(tab => {
        // 탭 버튼
        const tabBtn = document.createElement('button');
        tabBtn.className = 'stls-tab';
        tabBtn.textContent = tab.label;
        if (tab.id === activeTabId) {
            tabBtn.classList.add('active');
        }
        
        tabBtn.addEventListener('click', () => {
            // 모든 탭 비활성화
            container.querySelectorAll('.stls-tab').forEach(t => t.classList.remove('active'));
            container.querySelectorAll('.stls-tab-pane').forEach(p => p.style.display = 'none');
            
            // 선택된 탭 활성화
            tabBtn.classList.add('active');
            const pane = container.querySelector(`[data-tab-id="${tab.id}"]`);
            if (pane) {
                pane.style.display = 'block';
            }
        });
        
        tabHeader.appendChild(tabBtn);
        
        // 탭 콘텐츠
        const pane = document.createElement('div');
        pane.className = 'stls-tab-pane';
        pane.setAttribute('data-tab-id', tab.id);
        pane.style.display = tab.id === activeTabId ? 'block' : 'none';
        
        if (typeof tab.content === 'string') {
            pane.innerHTML = tab.content;
        } else if (tab.content instanceof HTMLElement) {
            pane.appendChild(tab.content);
        }
        
        tabContent.appendChild(pane);
    });
    
    container.appendChild(tabHeader);
    container.appendChild(tabContent);
    
    return container;
}

// 외부로 내보내기
window.STLifeSimUI = {
    showToast,
    showSuccess,
    showError,
    showInfo,
    showLoading,
    createDropdown,
    createTabs
};
