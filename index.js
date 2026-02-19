/**
 * ST-LifeSim - SillyTavern Third-Party Extension
 * 진입점: 모듈 로드 및 전체 ON/OFF 관리
 * 
 * 이 파일은 확장 프로그램의 메인 진입점입니다.
 * 모든 모듈을 로드하고 초기화하며, 전체 확장의 활성화/비활성화를 관리합니다.
 */

import { loadSettings, saveSettings, initializeSettings } from './settings.js';
import { initializeStorage } from './utils/storage.js';
import { initializeSlashCommands } from './utils/slash.js';
import { initializePopup } from './utils/popup.js';
import { initializeContextInjection } from './utils/context-inject.js';
import { initializeUI } from './utils/ui.js';

// 모듈 import
// import { initializeEmoticon } from './modules/emoticon/emoticon.js';
// import { initializeContacts } from './modules/contacts/contacts.js';
import { initializeQuickTools } from './modules/quick-tools/quick-tools.js';
// import { initializeCall } from './modules/call/call.js';
// import { initializeWallet } from './modules/wallet/wallet.js';
// import { initializeSNS } from './modules/sns/sns.js';
// import { initializeCalendar } from './modules/calendar/calendar.js';

// 전역 상태 객체
const lifesimState = {
    enabled: true,
    modules: {
        emoticon: { enabled: true },
        contacts: { enabled: true },
        quickTools: { enabled: true },
        call: { enabled: true },
        wallet: { enabled: true },
        sns: { enabled: true },
        calendar: { enabled: true }
    }
};

/**
 * 확장 프로그램 초기화 함수
 * SillyTavern이 확장을 로드할 때 자동으로 호출됩니다.
 */
async function initialize() {
    console.log('[ST-LifeSim] Initializing extension...');
    
    try {
        // 1. 설정 초기화
        await initializeSettings();
        const settings = await loadSettings();
        
        // 2. 전역 상태 업데이트
        if (settings.enabled !== undefined) {
            lifesimState.enabled = settings.enabled;
        }
        if (settings.modules) {
            Object.assign(lifesimState.modules, settings.modules);
        }
        
        // 3. 유틸리티 시스템 초기화
        await initializeStorage();
        await initializeSlashCommands();
        await initializePopup();
        await initializeContextInjection();
        await initializeUI();
        
        // 4. 모듈 초기화
        if (lifesimState.modules.quickTools.enabled) {
            await initializeQuickTools();
        }
        // 다른 모듈들은 Phase 2-4에서 순차 구현
        // if (lifesimState.modules.emoticon.enabled) {
        //     await initializeEmoticon();
        // }
        // ... 다른 모듈들
        
        // 5. 설정 UI 추가
        addSettingsUI();
        
        console.log('[ST-LifeSim] Extension initialized successfully');
    } catch (error) {
        console.error('[ST-LifeSim] Failed to initialize:', error);
    }
}

/**
 * 설정 UI를 SillyTavern 설정 패널에 추가
 */
function addSettingsUI() {
    const settingsHtml = `
        <div class="lifesim-settings">
            <h3>🎮 ST-LifeSim 설정</h3>
            
            <div class="lifesim-setting-item">
                <label>
                    <input type="checkbox" id="lifesim-enabled" ${lifesimState.enabled ? 'checked' : ''}>
                    <span>확장 활성화</span>
                </label>
            </div>
            
            <hr>
            
            <h4>모듈 활성화/비활성화</h4>
            
            <div class="lifesim-setting-item">
                <label>
                    <input type="checkbox" id="lifesim-module-emoticon" ${lifesimState.modules.emoticon.enabled ? 'checked' : ''}>
                    <span>😊 이모티콘</span>
                </label>
            </div>
            
            <div class="lifesim-setting-item">
                <label>
                    <input type="checkbox" id="lifesim-module-contacts" ${lifesimState.modules.contacts.enabled ? 'checked' : ''}>
                    <span>📋 NPC 연락처</span>
                </label>
            </div>
            
            <div class="lifesim-setting-item">
                <label>
                    <input type="checkbox" id="lifesim-module-quick-tools" ${lifesimState.modules.quickTools.enabled ? 'checked' : ''}>
                    <span>⚡ 퀵 도구 모음</span>
                </label>
            </div>
            
            <div class="lifesim-setting-item">
                <label>
                    <input type="checkbox" id="lifesim-module-call" ${lifesimState.modules.call.enabled ? 'checked' : ''}>
                    <span>📞 통화 & 통화기록</span>
                </label>
            </div>
            
            <div class="lifesim-setting-item">
                <label>
                    <input type="checkbox" id="lifesim-module-wallet" ${lifesimState.modules.wallet.enabled ? 'checked' : ''}>
                    <span>💰 지갑 & 송금</span>
                </label>
            </div>
            
            <div class="lifesim-setting-item">
                <label>
                    <input type="checkbox" id="lifesim-module-sns" ${lifesimState.modules.sns.enabled ? 'checked' : ''}>
                    <span>📸 SNS 피드</span>
                </label>
            </div>
            
            <div class="lifesim-setting-item">
                <label>
                    <input type="checkbox" id="lifesim-module-calendar" ${lifesimState.modules.calendar.enabled ? 'checked' : ''}>
                    <span>📅 캘린더</span>
                </label>
            </div>
            
            <hr>
            
            <button id="lifesim-save-settings" class="menu_button">설정 저장</button>
        </div>
    `;
    
    // SillyTavern 설정 패널에 추가
    const extensionsSettings = document.getElementById('extensions_settings');
    if (extensionsSettings) {
        const settingsDiv = document.createElement('div');
        settingsDiv.innerHTML = settingsHtml;
        extensionsSettings.appendChild(settingsDiv);
        
        // 이벤트 리스너 등록
        attachSettingsListeners();
    }
}

/**
 * 설정 UI 이벤트 리스너 등록
 */
function attachSettingsListeners() {
    // 전체 활성화/비활성화
    document.getElementById('lifesim-enabled')?.addEventListener('change', (e) => {
        lifesimState.enabled = e.target.checked;
    });
    
    // 모듈별 활성화/비활성화
    const modules = ['emoticon', 'contacts', 'quick-tools', 'call', 'wallet', 'sns', 'calendar'];
    modules.forEach(module => {
        const moduleKey = module.replace('-', '');
        document.getElementById(`lifesim-module-${module}`)?.addEventListener('change', (e) => {
            const key = module === 'quick-tools' ? 'quickTools' : moduleKey;
            lifesimState.modules[key].enabled = e.target.checked;
        });
    });
    
    // 저장 버튼
    document.getElementById('lifesim-save-settings')?.addEventListener('click', async () => {
        await saveSettings({
            enabled: lifesimState.enabled,
            modules: lifesimState.modules
        });
        
        // 토스트 알림 (ui.js에서 구현)
        if (window.lifesimUI && window.lifesimUI.showToast) {
            window.lifesimUI.showToast('설정이 저장되었습니다.', 'success');
        }
    });
}

/**
 * 전역 객체 노출 (다른 모듈에서 접근 가능)
 */
window.lifesim = {
    state: lifesimState,
    initialize
};

// jQuery 사용 가능할 때 초기화
jQuery(async () => {
    await initialize();
});
