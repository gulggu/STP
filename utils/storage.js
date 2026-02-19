/* ============================================================================
 * storage.js - 채팅별/캐릭터별 데이터 저장소 관리
 * ============================================================================
 * SillyTavern의 extension_settings를 활용하여 데이터를 저장/불러오기
 * 각 모듈의 데이터를 채팅별 또는 캐릭터별로 바인딩할 수 있도록 지원
 * ========================================================================== */

export class StorageManager {
    constructor() {
        this.extensionName = 'st-lifesim';
        this.settings = {};
    }

    /**
     * 확장 설정 초기화
     * SillyTavern의 extension_settings에서 데이터 로드
     */
    init() {
        if (!window.extension_settings) {
            window.extension_settings = {};
        }
        
        if (!window.extension_settings[this.extensionName]) {
            window.extension_settings[this.extensionName] = {
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
                globalData: {},
                chatData: {},
                characterData: {}
            };
        }
        
        this.settings = window.extension_settings[this.extensionName];
    }

    /**
     * 현재 활성 채팅 ID 가져오기
     * @returns {string|null} 채팅 ID
     */
    getCurrentChatId() {
        const context = window.SillyTavern?.getContext?.();
        return context?.chatId || context?.chat_id || null;
    }

    /**
     * 현재 활성 캐릭터 ID 가져오기
     * @returns {string|null} 캐릭터 ID
     */
    getCurrentCharacterId() {
        const context = window.SillyTavern?.getContext?.();
        return context?.characterId || context?.character_id || null;
    }

    /**
     * 데이터 저장
     * @param {string} module - 모듈 이름
     * @param {string} key - 데이터 키
     * @param {any} value - 저장할 값
     * @param {string} binding - 'chat', 'character', 'global' 중 하나
     */
    setData(module, key, value, binding = 'chat') {
        if (!this.settings) this.init();

        const fullKey = `${module}.${key}`;

        if (binding === 'chat') {
            const chatId = this.getCurrentChatId();
            if (!chatId) {
                console.warn('[ST-LifeSim] 채팅 ID를 가져올 수 없습니다. global로 저장합니다.');
                binding = 'global';
            } else {
                if (!this.settings.chatData[chatId]) {
                    this.settings.chatData[chatId] = {};
                }
                this.settings.chatData[chatId][fullKey] = value;
            }
        }

        if (binding === 'character') {
            const charId = this.getCurrentCharacterId();
            if (!charId) {
                console.warn('[ST-LifeSim] 캐릭터 ID를 가져올 수 없습니다. global로 저장합니다.');
                binding = 'global';
            } else {
                if (!this.settings.characterData[charId]) {
                    this.settings.characterData[charId] = {};
                }
                this.settings.characterData[charId][fullKey] = value;
            }
        }

        if (binding === 'global') {
            this.settings.globalData[fullKey] = value;
        }

        this.save();
    }

    /**
     * 데이터 불러오기
     * @param {string} module - 모듈 이름
     * @param {string} key - 데이터 키
     * @param {any} defaultValue - 기본값
     * @param {string} binding - 'chat', 'character', 'global' 중 하나
     * @returns {any} 저장된 값 또는 기본값
     */
    getData(module, key, defaultValue = null, binding = 'chat') {
        if (!this.settings) this.init();

        const fullKey = `${module}.${key}`;

        if (binding === 'chat') {
            const chatId = this.getCurrentChatId();
            if (chatId && this.settings.chatData[chatId]?.[fullKey] !== undefined) {
                return this.settings.chatData[chatId][fullKey];
            }
        }

        if (binding === 'character') {
            const charId = this.getCurrentCharacterId();
            if (charId && this.settings.characterData[charId]?.[fullKey] !== undefined) {
                return this.settings.characterData[charId][fullKey];
            }
        }

        if (this.settings.globalData[fullKey] !== undefined) {
            return this.settings.globalData[fullKey];
        }

        return defaultValue;
    }

    /**
     * 모듈 활성화 상태 확인
     * @param {string} module - 모듈 이름
     * @returns {boolean}
     */
    isModuleEnabled(module) {
        if (!this.settings) this.init();
        return this.settings.enabled && this.settings.modules[module]?.enabled;
    }

    /**
     * 모듈 활성화/비활성화
     * @param {string} module - 모듈 이름
     * @param {boolean} enabled - 활성화 여부
     */
    setModuleEnabled(module, enabled) {
        if (!this.settings) this.init();
        if (!this.settings.modules[module]) {
            this.settings.modules[module] = {};
        }
        this.settings.modules[module].enabled = enabled;
        this.save();
    }

    /**
     * 전체 확장 활성화/비활성화
     * @param {boolean} enabled - 활성화 여부
     */
    setExtensionEnabled(enabled) {
        if (!this.settings) this.init();
        this.settings.enabled = enabled;
        this.save();
    }

    /**
     * 설정 저장
     * SillyTavern의 saveSettingsDebounced 함수 호출
     */
    save() {
        if (window.saveSettingsDebounced) {
            window.saveSettingsDebounced();
        }
    }

    /**
     * 특정 채팅의 모든 데이터 삭제
     * @param {string} chatId - 채팅 ID
     */
    deleteChatData(chatId) {
        if (this.settings.chatData[chatId]) {
            delete this.settings.chatData[chatId];
            this.save();
        }
    }

    /**
     * 특정 캐릭터의 모든 데이터 삭제
     * @param {string} characterId - 캐릭터 ID
     */
    deleteCharacterData(characterId) {
        if (this.settings.characterData[characterId]) {
            delete this.settings.characterData[characterId];
            this.save();
        }
    }

    /**
     * 전체 데이터 내보내기 (백업용)
     * @returns {object} 모든 설정 데이터
     */
    exportData() {
        return JSON.parse(JSON.stringify(this.settings));
    }

    /**
     * 데이터 가져오기 (복원용)
     * @param {object} data - 복원할 데이터
     */
    importData(data) {
        this.settings = data;
        window.extension_settings[this.extensionName] = data;
        this.save();
    }
}

// 싱글톤 인스턴스 생성
export const storage = new StorageManager();
