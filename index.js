/* ===========================================
   ST-LifeSim 메인 진입점
   =========================================== */

(function() {
    'use strict';
    
    console.log('[ST-LifeSim] 확장 로딩 시작...');
    
    /**
     * 유틸리티 스크립트 로드
     */
    async function loadUtilities() {
        const utils = [
            'utils/storage.js',
            'utils/slash.js',
            'utils/popup.js',
            'utils/ui.js',
            'utils/context-inject.js'
        ];
        
        for (const util of utils) {
            await loadScript(util);
        }
        
        console.log('[ST-LifeSim] 유틸리티 로드 완료');
    }
    
    /**
     * 스크립트 동적 로드
     * @param {string} src - 스크립트 경로
     * @returns {Promise}
     */
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    /**
     * 스타일 동적 로드
     * @param {string} href - CSS 경로
     * @returns {Promise}
     */
    function loadStyle(href) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.onload = resolve;
            link.onerror = reject;
            document.head.appendChild(link);
        });
    }
    
    /**
     * 모듈 로드
     */
    async function loadModules(settings) {
        const modules = [];
        
        // 활성화된 모듈만 로드
        if (settings.modules.emoticon) {
            modules.push({ name: 'emoticon', js: 'modules/emoticon/emoticon.js', css: 'modules/emoticon/emoticon.css' });
        }
        if (settings.modules.contacts) {
            modules.push({ name: 'contacts', js: 'modules/contacts/contacts.js', css: 'modules/contacts/contacts.css' });
        }
        if (settings.modules.quickTools) {
            modules.push({ name: 'quick-tools', js: 'modules/quick-tools/quick-tools.js', css: null });
        }
        if (settings.modules.call) {
            modules.push({ name: 'call', js: 'modules/call/call.js', css: 'modules/call/call.css' });
        }
        if (settings.modules.wallet) {
            modules.push({ name: 'wallet', js: 'modules/wallet/wallet.js', css: 'modules/wallet/wallet.css' });
        }
        if (settings.modules.sns) {
            modules.push({ name: 'sns', js: 'modules/sns/sns.js', css: 'modules/sns/sns.css' });
        }
        if (settings.modules.calendar) {
            modules.push({ name: 'calendar', js: 'modules/calendar/calendar.js', css: 'modules/calendar/calendar.css' });
        }
        
        for (const module of modules) {
            try {
                if (module.css) {
                    await loadStyle(module.css);
                }
                await loadScript(module.js);
                console.log(`[ST-LifeSim] ${module.name} 모듈 로드 완료`);
            } catch (error) {
                console.error(`[ST-LifeSim] ${module.name} 모듈 로드 실패:`, error);
            }
        }
    }
    
    /**
     * UI 초기화
     */
    function initializeUI() {
        // 채팅 입력창 영역 찾기
        const chatArea = document.querySelector('#send_textarea') || document.querySelector('.send_textarea');
        
        if (chatArea && chatArea.parentElement) {
            // 설정 버튼 추가
            const settingsBtn = document.createElement('button');
            settingsBtn.className = 'stls-toolbar-btn';
            settingsBtn.innerHTML = '⚙️ ST-LifeSim';
            settingsBtn.style.cssText = 'margin-left: 10px;';
            settingsBtn.addEventListener('click', () => {
                window.STLifeSimSettings?.showSettingsPanel?.();
            });
            
            // 버튼을 적절한 위치에 추가
            const toolbar = chatArea.parentElement.querySelector('.mes_buttons') || chatArea.parentElement;
            if (toolbar) {
                toolbar.appendChild(settingsBtn);
            }
        }
        
        console.log('[ST-LifeSim] UI 초기화 완료');
    }
    
    /**
     * 컨텍스트 주입 등록
     */
    function registerContextInjection() {
        if (window.STLifeSimContext) {
            window.STLifeSimContext.registerContextInjection();
        }
    }
    
    /**
     * 확장 초기화
     */
    async function initialize() {
        try {
            // 설정 로드
            await loadScript('settings.js');
            const settings = window.STLifeSimSettings?.loadSettings?.() || { enabled: true, modules: {} };
            
            // 확장이 비활성화되어 있으면 중단
            if (!settings.enabled) {
                console.log('[ST-LifeSim] 확장이 비활성화되어 있습니다.');
                return;
            }
            
            // 유틸리티 로드
            await loadUtilities();
            
            // 모듈 로드
            await loadModules(settings);
            
            // UI 초기화
            initializeUI();
            
            // 컨텍스트 주입 등록
            registerContextInjection();
            
            console.log('[ST-LifeSim] 확장 로딩 완료!');
            
            // 토스트 알림
            if (window.STLifeSimUI) {
                window.STLifeSimUI.showSuccess('ST-LifeSim 확장이 활성화되었습니다.');
            }
        } catch (error) {
            console.error('[ST-LifeSim] 초기화 실패:', error);
        }
    }
    
    /**
     * 확장 재로드
     */
    function reload() {
        console.log('[ST-LifeSim] 확장 재로드 중...');
        // 페이지 새로고침이 가장 확실한 방법
        location.reload();
    }
    
    // 전역 객체로 내보내기
    window.STLifeSim = {
        initialize,
        reload,
        version: '1.0.0'
    };
    
    // SillyTavern이 로드된 후 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        // 이미 로드됨
        setTimeout(initialize, 1000);
    }
})();
