/* ============================================================================
 * popup.js - 공통 팝업 컴포넌트
 * ============================================================================
 * 모든 모듈에서 사용하는 오버레이 팝업 윈도우 생성/관리
 * ESC 키, 외부 클릭으로 닫기 기능 포함
 * ========================================================================== */

/**
 * 팝업 생성 및 표시
 * @param {Object} options - 팝업 옵션
 * @param {string} options.title - 팝업 제목
 * @param {string} options.content - 팝업 본문 HTML
 * @param {Array<Object>} options.buttons - 버튼 배열 {text, className, onClick}
 * @param {Function} options.onClose - 팝업 닫힐 때 콜백
 * @param {string} options.width - 팝업 너비 (기본: '600px')
 * @param {string} options.height - 팝업 높이 (기본: 'auto')
 * @returns {Object} 팝업 컨트롤 객체 {close, update}
 */
export function createPopup(options = {}) {
    const {
        title = '알림',
        content = '',
        buttons = [],
        onClose = null,
        width = '600px',
        height = 'auto'
    } = options;

    // 오버레이 생성
    const overlay = document.createElement('div');
    overlay.className = 'stls-overlay';
    
    // 팝업 윈도우 생성
    const popup = document.createElement('div');
    popup.className = 'stls-popup';
    popup.style.width = width;
    if (height !== 'auto') {
        popup.style.height = height;
    }
    
    // 헤더 생성
    const header = document.createElement('div');
    header.className = 'stls-popup-header';
    
    const titleEl = document.createElement('h3');
    titleEl.className = 'stls-popup-title';
    titleEl.textContent = title;
    
    const closeBtn = document.createElement('button');
    closeBtn.className = 'stls-popup-close';
    closeBtn.innerHTML = '×';
    closeBtn.onclick = () => closePopup();
    
    header.appendChild(titleEl);
    header.appendChild(closeBtn);
    
    // 본문 생성
    const body = document.createElement('div');
    body.className = 'stls-popup-body';
    if (typeof content === 'string') {
        body.innerHTML = content;
    } else if (content instanceof HTMLElement) {
        body.appendChild(content);
    }
    
    // 푸터 생성 (버튼이 있을 경우)
    const footer = document.createElement('div');
    footer.className = 'stls-popup-footer';
    
    if (buttons.length > 0) {
        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.className = `stls-btn ${btn.className || 'stls-btn-secondary'}`;
            button.textContent = btn.text;
            button.onclick = () => {
                if (btn.onClick) {
                    btn.onClick();
                }
                if (btn.closeOnClick !== false) {
                    closePopup();
                }
            };
            footer.appendChild(button);
        });
    }
    
    // 팝업 조립
    popup.appendChild(header);
    popup.appendChild(body);
    if (buttons.length > 0) {
        popup.appendChild(footer);
    }
    
    overlay.appendChild(popup);
    document.body.appendChild(overlay);
    
    // 팝업 닫기 함수
    function closePopup() {
        overlay.classList.add('closing');
        setTimeout(() => {
            overlay.remove();
            if (onClose) {
                onClose();
            }
        }, 200);
    }
    
    // ESC 키로 닫기
    function handleKeyDown(e) {
        if (e.key === 'Escape') {
            closePopup();
        }
    }
    
    // 외부 클릭으로 닫기
    function handleOutsideClick(e) {
        if (e.target === overlay) {
            closePopup();
        }
    }
    
    document.addEventListener('keydown', handleKeyDown);
    overlay.addEventListener('click', handleOutsideClick);
    
    // 정리 함수 래핑
    const originalClose = closePopup;
    closePopup = () => {
        document.removeEventListener('keydown', handleKeyDown);
        overlay.removeEventListener('click', handleOutsideClick);
        originalClose();
    };
    
    // 컨트롤 객체 반환
    return {
        close: closePopup,
        update: (newContent) => {
            if (typeof newContent === 'string') {
                body.innerHTML = newContent;
            } else if (newContent instanceof HTMLElement) {
                body.innerHTML = '';
                body.appendChild(newContent);
            }
        },
        getBody: () => body,
        getFooter: () => footer,
        getElement: () => popup
    };
}

/**
 * 확인 다이얼로그
 * @param {string} message - 확인 메시지
 * @param {string} title - 제목 (기본: '확인')
 * @returns {Promise<boolean>} 확인 여부
 */
export function confirm(message, title = '확인') {
    return new Promise((resolve) => {
        createPopup({
            title,
            content: `<p>${message}</p>`,
            buttons: [
                {
                    text: '취소',
                    className: 'stls-btn-secondary',
                    onClick: () => resolve(false)
                },
                {
                    text: '확인',
                    className: 'stls-btn-primary',
                    onClick: () => resolve(true)
                }
            ],
            onClose: () => resolve(false),
            width: '400px'
        });
    });
}

/**
 * 알림 다이얼로그
 * @param {string} message - 알림 메시지
 * @param {string} title - 제목 (기본: '알림')
 * @returns {Promise<void>}
 */
export function alert(message, title = '알림') {
    return new Promise((resolve) => {
        createPopup({
            title,
            content: `<p>${message}</p>`,
            buttons: [
                {
                    text: '확인',
                    className: 'stls-btn-primary',
                    onClick: () => resolve()
                }
            ],
            onClose: () => resolve(),
            width: '400px'
        });
    });
}

/**
 * 입력 다이얼로그
 * @param {string} message - 프롬프트 메시지
 * @param {string} defaultValue - 기본값
 * @param {string} title - 제목 (기본: '입력')
 * @returns {Promise<string|null>} 입력값 또는 null (취소 시)
 */
export function prompt(message, defaultValue = '', title = '입력') {
    return new Promise((resolve) => {
        const content = document.createElement('div');
        content.innerHTML = `
            <p>${message}</p>
            <input type="text" class="stls-input" value="${defaultValue}" id="stls-prompt-input" />
        `;
        
        const popup = createPopup({
            title,
            content,
            buttons: [
                {
                    text: '취소',
                    className: 'stls-btn-secondary',
                    onClick: () => resolve(null)
                },
                {
                    text: '확인',
                    className: 'stls-btn-primary',
                    onClick: () => {
                        const input = document.getElementById('stls-prompt-input');
                        resolve(input ? input.value : null);
                    }
                }
            ],
            onClose: () => resolve(null),
            width: '400px'
        });
        
        // 입력창에 포커스
        setTimeout(() => {
            const input = document.getElementById('stls-prompt-input');
            if (input) {
                input.focus();
                input.select();
            }
        }, 100);
    });
}

export default {
    createPopup,
    confirm,
    alert,
    prompt
};
