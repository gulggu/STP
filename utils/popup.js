/* ===========================================
   popup.js - 팝업창 공통 컴포넌트
   =========================================== */

/**
 * 팝업창 생성 및 표시
 * @param {Object} options - 팝업 옵션
 * @param {string} options.title - 팝업 제목
 * @param {string} options.content - HTML 콘텐츠 (문자열 또는 HTMLElement)
 * @param {Array} options.buttons - 버튼 배열 [{text, onClick, primary}]
 * @param {Function} options.onClose - 닫기 콜백
 * @param {string} options.width - 팝업 너비 (기본값: '600px')
 * @param {string} options.height - 팝업 높이 (기본값: 'auto')
 * @returns {HTMLElement} 팝업 엘리먼트
 */
function createPopup(options = {}) {
    const {
        title = '팝업',
        content = '',
        buttons = [],
        onClose = null,
        width = '600px',
        height = 'auto'
    } = options;

    // 오버레이 생성
    const overlay = document.createElement('div');
    overlay.className = 'stls-overlay';
    
    // 팝업 컨테이너 생성
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
    closeBtn.onclick = () => closePopup(overlay, onClose);
    
    header.appendChild(titleEl);
    header.appendChild(closeBtn);
    
    // 콘텐츠 영역 생성
    const contentEl = document.createElement('div');
    contentEl.className = 'stls-popup-content';
    
    if (typeof content === 'string') {
        contentEl.innerHTML = content;
    } else if (content instanceof HTMLElement) {
        contentEl.appendChild(content);
    }
    
    // 팝업 조립
    popup.appendChild(header);
    popup.appendChild(contentEl);
    
    // 버튼 영역 (있을 경우)
    if (buttons.length > 0) {
        const footer = document.createElement('div');
        footer.className = 'stls-popup-footer';
        
        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.className = btn.primary ? 'stls-btn stls-btn-primary' : 'stls-btn';
            button.textContent = btn.text || '확인';
            button.onclick = () => {
                if (btn.onClick) {
                    btn.onClick();
                }
                if (btn.close !== false) {
                    closePopup(overlay, onClose);
                }
            };
            footer.appendChild(button);
        });
        
        popup.appendChild(footer);
    }
    
    overlay.appendChild(popup);
    
    // ESC 키로 닫기
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closePopup(overlay, onClose);
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
    
    // 오버레이 클릭으로 닫기
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closePopup(overlay, onClose);
        }
    });
    
    // DOM에 추가
    document.body.appendChild(overlay);
    
    return popup;
}

/**
 * 팝업 닫기
 * @param {HTMLElement} overlay - 오버레이 엘리먼트
 * @param {Function} onClose - 닫기 콜백
 */
function closePopup(overlay, onClose) {
    if (overlay && overlay.parentNode) {
        overlay.remove();
        if (onClose) {
            onClose();
        }
    }
}

/**
 * 확인 다이얼로그 표시
 * @param {string} message - 메시지
 * @param {Function} onConfirm - 확인 콜백
 * @param {Function} onCancel - 취소 콜백
 */
function showConfirm(message, onConfirm, onCancel) {
    createPopup({
        title: '확인',
        content: `<p style="margin: 20px 0;">${message}</p>`,
        buttons: [
            {
                text: '취소',
                onClick: onCancel
            },
            {
                text: '확인',
                primary: true,
                onClick: onConfirm
            }
        ]
    });
}

/**
 * 입력 다이얼로그 표시
 * @param {string} message - 메시지
 * @param {string} defaultValue - 기본값
 * @param {Function} onConfirm - 확인 콜백 (입력값 전달)
 */
function showPrompt(message, defaultValue = '', onConfirm) {
    const content = document.createElement('div');
    content.innerHTML = `
        <p style="margin-bottom: 10px;">${message}</p>
        <input type="text" class="stls-input" value="${defaultValue}" id="stls-prompt-input">
    `;
    
    const popup = createPopup({
        title: '입력',
        content: content,
        buttons: [
            {
                text: '취소'
            },
            {
                text: '확인',
                primary: true,
                onClick: () => {
                    const input = document.getElementById('stls-prompt-input');
                    if (onConfirm && input) {
                        onConfirm(input.value);
                    }
                }
            }
        ]
    });
    
    // 입력 필드에 포커스
    setTimeout(() => {
        const input = document.getElementById('stls-prompt-input');
        if (input) {
            input.focus();
            input.select();
        }
    }, 100);
}

// 외부로 내보내기
window.STLifeSimPopup = {
    createPopup,
    closePopup,
    showConfirm,
    showPrompt
};
