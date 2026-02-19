/**
 * ST-LifeSim 설정 관리
 * 설정 저장/불러오기, 바인딩 분기 처리
 */

/**
 * 기본 설정 구조
 */
const DEFAULT_SETTINGS = {
    enabled: true,
    modules: {
        emoticon: { enabled: true },
        contacts: { enabled: true },
        quickTools: { enabled: true },
        call: { enabled: true },
        wallet: { enabled: true },
        sns: { enabled: true },
        calendar: { enabled: true }
    },
    // 각 모듈별 상세 설정은 여기에 추가
    emoticonSettings: {},
    contactsSettings: {},
    quickToolsSettings: {},
    callSettings: {},
    walletSettings: {},
    snsSettings: {},
    calendarSettings: {}
};

/**
 * 설정 초기화
 * 최초 실행 시 기본 설정을 로컬 스토리지에 저장
 */
export async function initializeSettings() {
    try {
        const existingSettings = localStorage.getItem('lifesim_settings');
        
        if (!existingSettings) {
            // 기본 설정 저장
            localStorage.setItem('lifesim_settings', JSON.stringify(DEFAULT_SETTINGS));
            console.log('[ST-LifeSim] Default settings initialized');
        }
    } catch (error) {
        console.error('[ST-LifeSim] Failed to initialize settings:', error);
    }
}

/**
 * 설정 불러오기
 * @returns {Promise<Object>} 저장된 설정 객체
 */
export async function loadSettings() {
    try {
        const settingsJson = localStorage.getItem('lifesim_settings');
        
        if (settingsJson) {
            const settings = JSON.parse(settingsJson);
            // 기본 설정과 병합 (새로운 설정 항목 대응)
            return { ...DEFAULT_SETTINGS, ...settings };
        }
        
        return DEFAULT_SETTINGS;
    } catch (error) {
        console.error('[ST-LifeSim] Failed to load settings:', error);
        return DEFAULT_SETTINGS;
    }
}

/**
 * 설정 저장하기
 * @param {Object} settings - 저장할 설정 객체
 * @returns {Promise<boolean>} 성공 여부
 */
export async function saveSettings(settings) {
    try {
        // 기존 설정과 병합
        const currentSettings = await loadSettings();
        const mergedSettings = { ...currentSettings, ...settings };
        
        localStorage.setItem('lifesim_settings', JSON.stringify(mergedSettings));
        console.log('[ST-LifeSim] Settings saved successfully');
        return true;
    } catch (error) {
        console.error('[ST-LifeSim] Failed to save settings:', error);
        return false;
    }
}

/**
 * 특정 모듈의 설정 불러오기
 * @param {string} moduleName - 모듈 이름 (emoticon, contacts 등)
 * @returns {Promise<Object>} 모듈 설정 객체
 */
export async function loadModuleSettings(moduleName) {
    try {
        const settings = await loadSettings();
        const settingsKey = `${moduleName}Settings`;
        return settings[settingsKey] || {};
    } catch (error) {
        console.error(`[ST-LifeSim] Failed to load ${moduleName} settings:`, error);
        return {};
    }
}

/**
 * 특정 모듈의 설정 저장하기
 * @param {string} moduleName - 모듈 이름
 * @param {Object} moduleSettings - 모듈 설정 객체
 * @returns {Promise<boolean>} 성공 여부
 */
export async function saveModuleSettings(moduleName, moduleSettings) {
    try {
        const settings = await loadSettings();
        const settingsKey = `${moduleName}Settings`;
        settings[settingsKey] = moduleSettings;
        return await saveSettings(settings);
    } catch (error) {
        console.error(`[ST-LifeSim] Failed to save ${moduleName} settings:`, error);
        return false;
    }
}

/**
 * 설정 초기화 (기본값으로 리셋)
 * @returns {Promise<boolean>} 성공 여부
 */
export async function resetSettings() {
    try {
        localStorage.setItem('lifesim_settings', JSON.stringify(DEFAULT_SETTINGS));
        console.log('[ST-LifeSim] Settings reset to defaults');
        return true;
    } catch (error) {
        console.error('[ST-LifeSim] Failed to reset settings:', error);
        return false;
    }
}

/**
 * 설정 내보내기 (JSON 파일로 다운로드)
 */
export async function exportSettings() {
    try {
        const settings = await loadSettings();
        const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `lifesim-settings-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('[ST-LifeSim] Settings exported successfully');
        return true;
    } catch (error) {
        console.error('[ST-LifeSim] Failed to export settings:', error);
        return false;
    }
}

/**
 * 설정 가져오기 (JSON 파일 업로드)
 * @param {File} file - 업로드할 JSON 파일
 * @returns {Promise<boolean>} 성공 여부
 */
export async function importSettings(file) {
    try {
        const text = await file.text();
        const settings = JSON.parse(text);
        
        // 유효성 검증 (필수 키 확인)
        if (settings.enabled === undefined || !settings.modules) {
            throw new Error('Invalid settings file format');
        }
        
        await saveSettings(settings);
        console.log('[ST-LifeSim] Settings imported successfully');
        return true;
    } catch (error) {
        console.error('[ST-LifeSim] Failed to import settings:', error);
        return false;
    }
}
