/**
 * ST-LifeSim 팝업 컴포넌트
 * 공통 팝업창 생성/열기/닫기 시스템
 * 
 * 모든 팝업은 ESC 키와 외부 클릭으로 닫을 수 있습니다.
 */

/**
 * 현재 열린 팝업 참조
 */
let currentPopup = null;

/**
 * 팝업 초기화
 */
export function initializePopup() {
    console.log('[ST-LifeSim Popup] Popup system initialized');
    
    // ESC 키로 팝업 닫기
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && currentPopup) {
            closePopup();
        }
    });
}

/**
 * 팝업 생성 및 표시
 * @param {Object} options - 팝업 옵션
 * @param {string} options.title - 팝업 제목
 * @param {string|HTMLElement} options.content - 팝업 내용 (HTML 문자열 또는 요소)
 * @param {Array<Object>} options.buttons - 하단 버튼 배열 (선택)
 * @param {string} options.width - 팝업 너비 (선택, 기본값: '600px')
 * @param {Function} options.onClose - 닫힐 때 콜백 (선택)
 * @returns {HTMLElement} 생성된 팝업 요소
 */
export function createPopup(options) {
    const {
        title = '팝업',
        content = '',
        buttons = [],
        width = '600px',
        onClose = null
    } = options;
    
    // 기존 팝업이 있으면 닫기
    if (currentPopup) {
        closePopup();
    }
    
    // 오버레이 생성
    const overlay = document.createElement('div');
    overlay.className = 'lifesim-overlay';
    
    // 팝업 컨테이너 생성
    const popup = document.createElement('div');
    popup.className = 'lifesim-popup';
    popup.style.width = width;
    
    // 헤더 생성
    const header = document.createElement('div');
    header.className = 'lifesim-popup-header';
    
    const titleElement = document.createElement('h3');
    titleElement.className = 'lifesim-popup-title';
    titleElement.textContent = title;
    
    const closeButton = document.createElement('button');
    closeButton.className = 'lifesim-popup-close';
    closeButton.innerHTML = '×';
    closeButton.onclick = () => closePopup();
    
    header.appendChild(titleElement);
    header.appendChild(closeButton);
    
    // 본문 생성
    const body = document.createElement('div');
    body.className = 'lifesim-popup-body';
    
    if (typeof content === 'string') {
        body.innerHTML = content;
    } else if (content instanceof HTMLElement) {
        body.appendChild(content);
    }
    
    // 하단 버튼 영역 생성 (버튼이 있을 경우)
    let footer = null;
    if (buttons.length > 0) {
        footer = document.createElement('div');
        footer.className = 'lifesim-popup-footer';
        
        buttons.forEach(btnConfig => {
            const btn = document.createElement('button');
            btn.className = `lifesim-btn ${btnConfig.className || ''}`;
            btn.textContent = btnConfig.text || '버튼';
            
            if (btnConfig.onClick) {
                btn.onclick = () => {
                    btnConfig.onClick();
                    if (btnConfig.closeOnClick !== false) {
                        closePopup();
                    }
                };
            }
            
            footer.appendChild(btn);
        });
    }
    
    // 조립
    popup.appendChild(header);
    popup.appendChild(body);
    if (footer) {
        popup.appendChild(footer);
    }
    
    overlay.appendChild(popup);
    
    // 외부 클릭으로 닫기
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closePopup();
        }
    });
    
    // DOM에 추가
    document.body.appendChild(overlay);
    
    // 현재 팝업 저장
    currentPopup = {
        overlay,
        popup,
        onClose
    };
    
    return popup;
}

/**
 * 현재 열린 팝업 닫기
 */
export function closePopup() {
    if (!currentPopup) return;
    
    const { overlay, onClose } = currentPopup;
    
    // 닫기 애니메이션
    overlay.style.animation = 'fadeOut 0.2s ease-in-out forwards';
    
    setTimeout(() => {
        if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
        }
        
        if (onClose) {
            onClose();
        }
        
        currentPopup = null;
    }, 200);
}

/**
 * 확인 다이얼로그 표시
 * @param {string} message - 메시지
 * @param {Function} onConfirm - 확인 시 콜백
 * @param {Function} onCancel - 취소 시 콜백 (선택)
 */
export function showConfirmDialog(message, onConfirm, onCancel = null) {
    const messageElement = document.createElement('p');
    messageElement.style.margin = '20px 0';
    messageElement.textContent = message; // XSS 방지
    
    createPopup({
        title: '확인',
        content: messageElement,
        width: '400px',
        buttons: [
            {
                text: '취소',
                className: '',
                onClick: () => {
                    if (onCancel) onCancel();
                }
            },
            {
                text: '확인',
                className: 'lifesim-btn-primary',
                onClick: onConfirm
            }
        ]
    });
}

/**
 * 알림 다이얼로그 표시
 * @param {string} message - 메시지
 * @param {Function} onOk - 확인 시 콜백 (선택)
 */
export function showAlertDialog(message, onOk = null) {
    const messageElement = document.createElement('p');
    messageElement.style.margin = '20px 0';
    messageElement.textContent = message; // XSS 방지
    
    createPopup({
        title: '알림',
        content: messageElement,
        width: '400px',
        buttons: [
            {
                text: '확인',
                className: 'lifesim-btn-primary',
                onClick: () => {
                    if (onOk) onOk();
                }
            }
        ]
    });
}

/**
 * 입력 다이얼로그 표시
 * @param {string} message - 메시지
 * @param {string} defaultValue - 기본값 (선택)
 * @param {Function} onSubmit - 제출 시 콜백 (입력값을 인자로 받음)
 */
export function showInputDialog(message, defaultValue = '', onSubmit) {
    const inputId = 'lifesim-input-dialog-' + Date.now();
    
    const content = `
        <div style="margin: 20px 0;">
            <p style="margin-bottom: 10px;">${message}</p>
            <input type="text" id="${inputId}" class="lifesim-input" value="${defaultValue}">
        </div>
    `;
    
    const popup = createPopup({
        title: '입력',
        content: content,
        width: '400px',
        buttons: [
            {
                text: '취소',
                className: ''
            },
            {
                text: '확인',
                className: 'lifesim-btn-primary',
                onClick: () => {
                    const input = document.getElementById(inputId);
                    if (input && onSubmit) {
                        onSubmit(input.value);
                    }
                }
            }
        ]
    });
    
    // 입력 필드에 자동 포커스
    setTimeout(() => {
        const input = document.getElementById(inputId);
        if (input) {
            input.focus();
            input.select();
        }
    }, 100);
}

/**
 * 탭 기능이 있는 팝업 생성
 * @param {Object} options - 팝업 옵션
 * @param {string} options.title - 팝업 제목
 * @param {Array<Object>} options.tabs - 탭 배열
 * @param {string} options.tabs[].id - 탭 ID
 * @param {string} options.tabs[].label - 탭 레이블
 * @param {string|HTMLElement} options.tabs[].content - 탭 내용
 * @param {string} options.defaultTab - 기본 활성 탭 ID (선택)
 * @param {string} options.width - 팝업 너비 (선택)
 * @returns {HTMLElement} 생성된 팝업 요소
 */
export function createTabbedPopup(options) {
    const {
        title = '탭 팝업',
        tabs = [],
        defaultTab = null,
        width = '700px'
    } = options;
    
    if (tabs.length === 0) {
        console.error('[ST-LifeSim Popup] No tabs provided for tabbed popup');
        return;
    }
    
    const activeTabId = defaultTab || tabs[0].id;
    
    // 탭 헤더 생성
    const tabsHtml = tabs.map(tab => 
        `<button class="lifesim-tab ${tab.id === activeTabId ? 'active' : ''}" data-tab="${tab.id}">${tab.label}</button>`
    ).join('');
    
    // 탭 내용 컨테이너 생성
    const contentContainer = document.createElement('div');
    contentContainer.className = 'lifesim-tab-contents';
    
    // 각 탭 내용 생성
    tabs.forEach(tab => {
        const tabContent = document.createElement('div');
        tabContent.className = 'lifesim-tab-content';
        tabContent.dataset.tab = tab.id;
        tabContent.style.display = tab.id === activeTabId ? 'block' : 'none';
        
        if (typeof tab.content === 'string') {
            tabContent.innerHTML = tab.content;
        } else if (tab.content instanceof HTMLElement) {
            tabContent.appendChild(tab.content);
        }
        
        contentContainer.appendChild(tabContent);
    });
    
    // 전체 내용
    const fullContent = document.createElement('div');
    fullContent.innerHTML = `<div class="lifesim-tabs">${tabsHtml}</div>`;
    fullContent.appendChild(contentContainer);
    
    const popup = createPopup({
        title,
        content: fullContent,
        width
    });
    
    // 탭 클릭 이벤트
    popup.querySelectorAll('.lifesim-tab').forEach(tabButton => {
        tabButton.addEventListener('click', () => {
            const tabId = tabButton.dataset.tab;
            
            // 모든 탭 비활성화
            popup.querySelectorAll('.lifesim-tab').forEach(t => t.classList.remove('active'));
            popup.querySelectorAll('.lifesim-tab-content').forEach(c => c.style.display = 'none');
            
            // 선택된 탭 활성화
            tabButton.classList.add('active');
            const targetContent = popup.querySelector(`.lifesim-tab-content[data-tab="${tabId}"]`);
            if (targetContent) {
                targetContent.style.display = 'block';
            }
        });
    });
    
    return popup;
}

/**
 * 현재 팝업이 열려있는지 확인
 * @returns {boolean}
 */
export function isPopupOpen() {
    return currentPopup !== null;
}
