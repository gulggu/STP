/* ============================================================================
 * ST-LifeSim - SillyTavern Life Simulation Extension
 * ============================================================================
 * 메인 진입점: 모듈 로드 및 전체 ON/OFF 관리
 * 
 * 개발 원칙:
 * - 모듈화: 각 기능은 독립된 모듈
 * - 유지보수성: 공통 유틸 함수 철저히 분리
 * - 주석: 모든 함수/로직에 한국어 주석
 * - ON/OFF: 확장 전체 + 모듈별 개별 활성화/비활성화
 * - 바인딩: 채팅별 기본 / 캐릭터별 선택
 * ========================================================================== */

import { storage } from './utils/storage.js';
import { contextInjector } from './utils/context-inject.js';
import { showSettings } from './settings.js';
import { showSuccess, showInfo } from './utils/ui.js';

// 모듈 동적 import
const modules = {};

/**
 * 확장 초기화
 */
async function init() {
    console.log('[ST-LifeSim] 확장 로드 시작...');
    
    // 스토리지 초기화
    storage.init();
    
    // 확장이 비활성화되어 있으면 종료
    if (!storage.settings.enabled) {
        console.log('[ST-LifeSim] 확장이 비활성화되어 있습니다.');
        return;
    }
    
    // UI에 설정 버튼 추가
    addSettingsButton();
    
    // 모듈 로드
    await loadModules();
    
    // 컨텍스트 인젝터 활성화
    contextInjector.hookIntoSillyTavern();
    
    console.log('[ST-LifeSim] 확장 로드 완료!');
    showInfo('ST-LifeSim 확장이 로드되었습니다.');
}

/**
 * 설정 버튼을 UI에 추가
 */
function addSettingsButton() {
    // SillyTavern의 확장 버튼 영역 찾기
    const extensionsButton = document.querySelector('#extensions_settings');
    if (!extensionsButton) {
        console.warn('[ST-LifeSim] 확장 설정 버튼을 찾을 수 없습니다.');
        return;
    }
    
    // 버튼이 이미 있으면 제거
    const existingButton = document.querySelector('#stls-settings-btn');
    if (existingButton) {
        existingButton.remove();
    }
    
    // 새 버튼 생성
    const button = document.createElement('div');
    button.id = 'stls-settings-btn';
    button.className = 'list-group-item flex-container flexGap5';
    button.style.cursor = 'pointer';
    button.innerHTML = `
        <div class="fa-solid fa-life-ring extensionsMenuExtensionButton"></div>
        ST-LifeSim 설정
    `;
    
    button.addEventListener('click', () => {
        showSettings();
    });
    
    // 확장 메뉴에 버튼 추가
    const menu = extensionsButton.nextElementSibling;
    if (menu && menu.classList.contains('list-group')) {
        menu.appendChild(button);
    } else {
        // 대체 위치에 추가
        const settingsPanel = document.querySelector('#extensions_settings2');
        if (settingsPanel) {
            const btnContainer = document.createElement('div');
            btnContainer.style.cssText = 'padding: 10px; border-top: 1px solid rgba(255,255,255,0.1);';
            btnContainer.appendChild(button);
            settingsPanel.insertBefore(btnContainer, settingsPanel.firstChild);
        }
    }
}

/**
 * 모듈 동적 로드
 */
async function loadModules() {
    console.log('[ST-LifeSim] 모듈 로드 중...');
    
    // Phase 1, 2, 3에서 구현된 모듈들만 로드 시도
    const moduleList = [
        // Phase 2
        { name: 'emoticon', path: './modules/emoticon/emoticon.js' },
        { name: 'quickTools', path: './modules/quick-tools/quick-tools.js' },
        
        // Phase 3
        { name: 'contacts', path: './modules/contacts/contacts.js' },
        { name: 'wallet', path: './modules/wallet/wallet.js' },
        { name: 'calendar', path: './modules/calendar/calendar.js' },
        
        // Phase 4
        { name: 'sns', path: './modules/sns/sns.js' },
        { name: 'call', path: './modules/call/call.js' }
    ];
    
    for (const { name, path } of moduleList) {
        try {
            // 모듈이 활성화되어 있는지 확인
            if (!storage.isModuleEnabled(name)) {
                console.log(`[ST-LifeSim] ${name} 모듈이 비활성화되어 있습니다.`);
                continue;
            }
            
            // 모듈 import (존재하지 않을 수 있음)
            const module = await import(path).catch(() => null);
            
            if (module && module.init) {
                await module.init();
                modules[name] = module;
                console.log(`[ST-LifeSim] ${name} 모듈 로드 완료`);
            } else {
                console.log(`[ST-LifeSim] ${name} 모듈이 아직 구현되지 않았습니다.`);
            }
        } catch (error) {
            console.error(`[ST-LifeSim] ${name} 모듈 로드 실패:`, error);
        }
    }
}

/**
 * 확장 종료
 */
function cleanup() {
    console.log('[ST-LifeSim] 확장 종료...');
    
    // 각 모듈의 cleanup 함수 호출
    Object.values(modules).forEach(module => {
        if (module.cleanup) {
            module.cleanup();
        }
    });
    
    // 컨텍스트 인젝터 비활성화
    contextInjector.setEnabled(false);
}

// jQuery ready 이벤트 대기
jQuery(async () => {
    // SillyTavern이 완전히 로드될 때까지 대기
    if (window.SillyTavern) {
        await init();
    } else {
        // SillyTavern 로드 대기
        const checkInterval = setInterval(() => {
            if (window.SillyTavern) {
                clearInterval(checkInterval);
                init();
            }
        }, 100);
        
        // 10초 후 타임아웃
        setTimeout(() => {
            clearInterval(checkInterval);
            console.error('[ST-LifeSim] SillyTavern을 찾을 수 없습니다.');
        }, 10000);
    }
});

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', cleanup);

// 전역 API 노출 (디버깅용)
window.STLifeSim = {
    storage,
    contextInjector,
    modules,
    showSettings,
    version: '0.1.0'
};

export default {
    init,
    cleanup,
    modules
};
