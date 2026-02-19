/* ===========================================
   storage.js - 채팅별/캐릭터별 저장소 관리
   =========================================== */

// 저장소 타입 상수
const STORAGE_TYPE = {
    CHAT: 'chat',      // 채팅별 저장
    CHARACTER: 'character'  // 캐릭터별 저장
};

/**
 * 현재 채팅 ID를 가져옴
 * @returns {string} 채팅 ID
 */
function getCurrentChatId() {
    // SillyTavern의 chat_metadata를 통해 현재 채팅 ID 획득
    return window.SillyTavern?.getContext()?.chatId || 'default';
}

/**
 * 현재 캐릭터 ID를 가져옴
 * @returns {string} 캐릭터 ID
 */
function getCurrentCharacterId() {
    // SillyTavern의 context를 통해 현재 캐릭터 ID 획득
    const context = window.SillyTavern?.getContext();
    return context?.characterId || context?.name || 'default';
}

/**
 * 데이터를 저장
 * @param {string} key - 저장할 키
 * @param {*} data - 저장할 데이터
 * @param {string} storageType - 'chat' 또는 'character'
 */
function saveData(key, data, storageType = STORAGE_TYPE.CHAT) {
    const prefix = storageType === STORAGE_TYPE.CHAT 
        ? `stls_chat_${getCurrentChatId()}_`
        : `stls_char_${getCurrentCharacterId()}_`;
    
    const fullKey = prefix + key;
    
    try {
        localStorage.setItem(fullKey, JSON.stringify(data));
        console.log(`[ST-LifeSim] 데이터 저장: ${fullKey}`);
    } catch (error) {
        console.error(`[ST-LifeSim] 저장 실패: ${fullKey}`, error);
    }
}

/**
 * 데이터를 불러옴
 * @param {string} key - 불러올 키
 * @param {*} defaultValue - 기본값
 * @param {string} storageType - 'chat' 또는 'character'
 * @returns {*} 저장된 데이터 또는 기본값
 */
function loadData(key, defaultValue = null, storageType = STORAGE_TYPE.CHAT) {
    const prefix = storageType === STORAGE_TYPE.CHAT 
        ? `stls_chat_${getCurrentChatId()}_`
        : `stls_char_${getCurrentCharacterId()}_`;
    
    const fullKey = prefix + key;
    
    try {
        const data = localStorage.getItem(fullKey);
        if (data === null) {
            return defaultValue;
        }
        return JSON.parse(data);
    } catch (error) {
        console.error(`[ST-LifeSim] 불러오기 실패: ${fullKey}`, error);
        return defaultValue;
    }
}

/**
 * 데이터를 삭제
 * @param {string} key - 삭제할 키
 * @param {string} storageType - 'chat' 또는 'character'
 */
function deleteData(key, storageType = STORAGE_TYPE.CHAT) {
    const prefix = storageType === STORAGE_TYPE.CHAT 
        ? `stls_chat_${getCurrentChatId()}_`
        : `stls_char_${getCurrentCharacterId()}_`;
    
    const fullKey = prefix + key;
    
    try {
        localStorage.removeItem(fullKey);
        console.log(`[ST-LifeSim] 데이터 삭제: ${fullKey}`);
    } catch (error) {
        console.error(`[ST-LifeSim] 삭제 실패: ${fullKey}`, error);
    }
}

/**
 * 특정 접두사로 시작하는 모든 키 목록을 가져옴
 * @param {string} storageType - 'chat' 또는 'character'
 * @returns {Array} 키 목록
 */
function getAllKeys(storageType = STORAGE_TYPE.CHAT) {
    const prefix = storageType === STORAGE_TYPE.CHAT 
        ? `stls_chat_${getCurrentChatId()}_`
        : `stls_char_${getCurrentCharacterId()}_`;
    
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(prefix)) {
            keys.push(key.substring(prefix.length));
        }
    }
    return keys;
}

/**
 * 모든 ST-LifeSim 데이터를 백업
 * @returns {Object} 백업 데이터
 */
function backupAllData() {
    const backup = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('stls_')) {
            backup[key] = localStorage.getItem(key);
        }
    }
    return backup;
}

/**
 * 백업 데이터를 복원
 * @param {Object} backup - 백업 데이터
 */
function restoreAllData(backup) {
    Object.keys(backup).forEach(key => {
        localStorage.setItem(key, backup[key]);
    });
    console.log('[ST-LifeSim] 데이터 복원 완료');
}

// 외부로 내보내기
window.STLifeSimStorage = {
    STORAGE_TYPE,
    saveData,
    loadData,
    deleteData,
    getAllKeys,
    backupAllData,
    restoreAllData,
    getCurrentChatId,
    getCurrentCharacterId
};
