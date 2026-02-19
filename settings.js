/* ===========================================
   settings.js - 설정 저장/불러오기 및 설정 패널
   =========================================== */

/**
 * 기본 설정값
 */
const DEFAULT_SETTINGS = {
    enabled: true,
    modules: {
        emoticon: true,
        contacts: true,
        quickTools: true,
        call: true,
        wallet: true,
        sns: true,
        calendar: true
    },
    quickTools: {
        quickSendShortcut: 'Ctrl+Shift+Enter'
    }
};

/**
 * 설정 불러오기
 * @returns {Object} 설정 객체
 */
function loadSettings() {
    try {
        const saved = localStorage.getItem('stls_settings');
        if (saved) {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
        }
    } catch (error) {
        console.error('[ST-LifeSim] 설정 불러오기 실패:', error);
    }
    return DEFAULT_SETTINGS;
}

/**
 * 설정 저장
 * @param {Object} settings - 저장할 설정
 */
function saveSettings(settings) {
    try {
        localStorage.setItem('stls_settings', JSON.stringify(settings));
        console.log('[ST-LifeSim] 설정 저장 완료');
    } catch (error) {
        console.error('[ST-LifeSim] 설정 저장 실패:', error);
    }
}

/**
 * 설정 패널 UI 생성
 * @returns {HTMLElement} 설정 패널 엘리먼트
 */
function createSettingsPanel() {
    const settings = loadSettings();
    
    const panel = document.createElement('div');
    panel.innerHTML = `
        <div class="stls-form-group">
            <label class="stls-form-label">
                <input type="checkbox" id="stls-enabled" ${settings.enabled ? 'checked' : ''}>
                확장 전체 활성화
            </label>
        </div>
        
        <h4 style="margin-top: 20px; margin-bottom: 10px; color: var(--SmartThemeEmColor, #fff);">모듈 개별 설정</h4>
        
        <div class="stls-form-group">
            <label class="stls-form-label">
                <input type="checkbox" id="stls-module-emoticon" ${settings.modules.emoticon ? 'checked' : ''}>
                😊 이모티콘
            </label>
        </div>
        
        <div class="stls-form-group">
            <label class="stls-form-label">
                <input type="checkbox" id="stls-module-contacts" ${settings.modules.contacts ? 'checked' : ''}>
                📋 NPC 연락처
            </label>
        </div>
        
        <div class="stls-form-group">
            <label class="stls-form-label">
                <input type="checkbox" id="stls-module-quickTools" ${settings.modules.quickTools ? 'checked' : ''}>
                ⚡ 퀵 도구 모음
            </label>
        </div>
        
        <div class="stls-form-group">
            <label class="stls-form-label">
                <input type="checkbox" id="stls-module-call" ${settings.modules.call ? 'checked' : ''}>
                📞 통화 & 통화기록
            </label>
        </div>
        
        <div class="stls-form-group">
            <label class="stls-form-label">
                <input type="checkbox" id="stls-module-wallet" ${settings.modules.wallet ? 'checked' : ''}>
                💰 지갑 & 송금
            </label>
        </div>
        
        <div class="stls-form-group">
            <label class="stls-form-label">
                <input type="checkbox" id="stls-module-sns" ${settings.modules.sns ? 'checked' : ''}>
                📸 SNS 피드
            </label>
        </div>
        
        <div class="stls-form-group">
            <label class="stls-form-label">
                <input type="checkbox" id="stls-module-calendar" ${settings.modules.calendar ? 'checked' : ''}>
                📅 캘린더
            </label>
        </div>
        
        <h4 style="margin-top: 20px; margin-bottom: 10px; color: var(--SmartThemeEmColor, #fff);">컨텍스트 정보</h4>
        <div style="padding: 10px; background: var(--SmartThemeBodyColor, #1a1a1a); border-radius: 4px; margin-bottom: 10px;">
            <p style="margin: 5px 0; color: var(--SmartThemeEmColor, #aaa);">
                현재 컨텍스트 토큰 수: <strong id="stls-token-count">0</strong>
            </p>
        </div>
        
        <div style="margin-top: 20px;">
            <button class="stls-btn stls-btn-primary" id="stls-save-settings">설정 저장</button>
            <button class="stls-btn" id="stls-backup-data">데이터 백업</button>
            <button class="stls-btn" id="stls-restore-data">데이터 복원</button>
        </div>
    `;
    
    // 토큰 수 업데이트
    const updateTokenCount = () => {
        const count = window.STLifeSimContext?.getContextTokenCount?.() || 0;
        const el = panel.querySelector('#stls-token-count');
        if (el) {
            el.textContent = count;
        }
    };
    updateTokenCount();
    
    // 설정 저장 버튼
    const saveBtn = panel.querySelector('#stls-save-settings');
    saveBtn.addEventListener('click', () => {
        const newSettings = {
            enabled: panel.querySelector('#stls-enabled').checked,
            modules: {
                emoticon: panel.querySelector('#stls-module-emoticon').checked,
                contacts: panel.querySelector('#stls-module-contacts').checked,
                quickTools: panel.querySelector('#stls-module-quickTools').checked,
                call: panel.querySelector('#stls-module-call').checked,
                wallet: panel.querySelector('#stls-module-wallet').checked,
                sns: panel.querySelector('#stls-module-sns').checked,
                calendar: panel.querySelector('#stls-module-calendar').checked
            },
            quickTools: settings.quickTools
        };
        
        saveSettings(newSettings);
        window.STLifeSimUI?.showSuccess?.('설정이 저장되었습니다.');
        
        // 모듈 재로드
        if (window.STLifeSim?.reload) {
            window.STLifeSim.reload();
        }
    });
    
    // 데이터 백업 버튼
    const backupBtn = panel.querySelector('#stls-backup-data');
    backupBtn.addEventListener('click', () => {
        const backup = window.STLifeSimStorage?.backupAllData?.();
        if (backup) {
            const dataStr = JSON.stringify(backup, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `stlifesim-backup-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            window.STLifeSimUI?.showSuccess?.('데이터를 백업했습니다.');
        }
    });
    
    // 데이터 복원 버튼
    const restoreBtn = panel.querySelector('#stls-restore-data');
    restoreBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const backup = JSON.parse(e.target.result);
                        window.STLifeSimStorage?.restoreAllData?.(backup);
                        window.STLifeSimUI?.showSuccess?.('데이터를 복원했습니다. 페이지를 새로고침해주세요.');
                    } catch (error) {
                        window.STLifeSimUI?.showError?.('복원 실패: 올바른 백업 파일이 아닙니다.');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    });
    
    return panel;
}

/**
 * 설정 패널 표시
 */
function showSettingsPanel() {
    const panel = createSettingsPanel();
    window.STLifeSimPopup?.createPopup?.({
        title: 'ST-LifeSim 설정',
        content: panel,
        width: '600px'
    });
}

// 외부로 내보내기
window.STLifeSimSettings = {
    DEFAULT_SETTINGS,
    loadSettings,
    saveSettings,
    createSettingsPanel,
    showSettingsPanel
};
