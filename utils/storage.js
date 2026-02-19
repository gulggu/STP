/**
 * ST-LifeSim 스토리지 유틸리티
 * 채팅별/캐릭터별 저장소 분기 로직
 * 
 * 이 모듈은 데이터를 채팅별 또는 캐릭터별로 저장하고 불러오는 기능을 제공합니다.
 * 각 항목(연락처, 지갑 등)은 독립적으로 바인딩 방식을 선택할 수 있습니다.
 */

/**
 * 현재 채팅 ID 가져오기
 * @returns {string|null} 현재 채팅 ID
 */
function getCurrentChatId() {
    // SillyTavern의 현재 채팅 ID 가져오기
    // SillyTavern API에 따라 조정 필요
    if (window.SillyTavern && window.SillyTavern.getContext) {
        const context = window.SillyTavern.getContext();
        return context.chatId || context.chat_id || null;
    }
    
    // 대체 방법
    return sessionStorage.getItem('current_chat_id') || 'default_chat';
}

/**
 * 현재 캐릭터 ID 가져오기
 * @returns {string|null} 현재 캐릭터 ID
 */
function getCurrentCharacterId() {
    // SillyTavern의 현재 캐릭터 ID 가져오기
    if (window.SillyTavern && window.SillyTavern.getContext) {
        const context = window.SillyTavern.getContext();
        return context.characterId || context.character_id || null;
    }
    
    // 대체 방법
    return sessionStorage.getItem('current_character_id') || 'default_character';
}

/**
 * 스토리지 키 생성
 * @param {string} dataType - 데이터 타입 (contacts, wallet 등)
 * @param {string} binding - 바인딩 방식 ('chat' 또는 'character')
 * @returns {string} 스토리지 키
 */
function getStorageKey(dataType, binding = 'chat') {
    const prefix = 'lifesim';
    
    if (binding === 'character') {
        const characterId = getCurrentCharacterId();
        return `${prefix}_character_${characterId}_${dataType}`;
    } else {
        const chatId = getCurrentChatId();
        return `${prefix}_chat_${chatId}_${dataType}`;
    }
}

/**
 * 데이터 저장
 * @param {string} dataType - 데이터 타입
 * @param {Object} data - 저장할 데이터
 * @param {string} binding - 바인딩 방식 ('chat' 또는 'character')
 * @returns {boolean} 성공 여부
 */
export function saveData(dataType, data, binding = 'chat') {
    try {
        const key = getStorageKey(dataType, binding);
        const jsonData = JSON.stringify(data);
        localStorage.setItem(key, jsonData);
        
        console.log(`[ST-LifeSim Storage] Saved ${dataType} (${binding} binding)`);
        return true;
    } catch (error) {
        console.error(`[ST-LifeSim Storage] Failed to save ${dataType}:`, error);
        return false;
    }
}

/**
 * 데이터 불러오기
 * @param {string} dataType - 데이터 타입
 * @param {string} binding - 바인딩 방식 ('chat' 또는 'character')
 * @param {*} defaultValue - 기본값 (데이터가 없을 경우)
 * @returns {*} 불러온 데이터 또는 기본값
 */
export function loadData(dataType, binding = 'chat', defaultValue = null) {
    try {
        const key = getStorageKey(dataType, binding);
        const jsonData = localStorage.getItem(key);
        
        if (jsonData) {
            const data = JSON.parse(jsonData);
            console.log(`[ST-LifeSim Storage] Loaded ${dataType} (${binding} binding)`);
            return data;
        }
        
        return defaultValue;
    } catch (error) {
        console.error(`[ST-LifeSim Storage] Failed to load ${dataType}:`, error);
        return defaultValue;
    }
}

/**
 * 데이터 삭제
 * @param {string} dataType - 데이터 타입
 * @param {string} binding - 바인딩 방식 ('chat' 또는 'character')
 * @returns {boolean} 성공 여부
 */
export function deleteData(dataType, binding = 'chat') {
    try {
        const key = getStorageKey(dataType, binding);
        localStorage.removeItem(key);
        
        console.log(`[ST-LifeSim Storage] Deleted ${dataType} (${binding} binding)`);
        return true;
    } catch (error) {
        console.error(`[ST-LifeSim Storage] Failed to delete ${dataType}:`, error);
        return false;
    }
}

/**
 * 모든 채팅의 데이터 목록 가져오기
 * @param {string} dataType - 데이터 타입
 * @returns {Array<Object>} 데이터 목록
 */
export function getAllChatData(dataType) {
    try {
        const prefix = `lifesim_chat_`;
        const suffix = `_${dataType}`;
        const results = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(prefix) && key.endsWith(suffix)) {
                const data = JSON.parse(localStorage.getItem(key));
                const chatId = key.replace(prefix, '').replace(suffix, '');
                results.push({ chatId, data });
            }
        }
        
        return results;
    } catch (error) {
        console.error(`[ST-LifeSim Storage] Failed to get all chat data:`, error);
        return [];
    }
}

/**
 * 모든 캐릭터의 데이터 목록 가져오기
 * @param {string} dataType - 데이터 타입
 * @returns {Array<Object>} 데이터 목록
 */
export function getAllCharacterData(dataType) {
    try {
        const prefix = `lifesim_character_`;
        const suffix = `_${dataType}`;
        const results = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(prefix) && key.endsWith(suffix)) {
                const data = JSON.parse(localStorage.getItem(key));
                const characterId = key.replace(prefix, '').replace(suffix, '');
                results.push({ characterId, data });
            }
        }
        
        return results;
    } catch (error) {
        console.error(`[ST-LifeSim Storage] Failed to get all character data:`, error);
        return [];
    }
}

/**
 * 바인딩 방식 변경
 * 채팅별 → 캐릭터별 또는 그 반대로 데이터 이동
 * @param {string} dataType - 데이터 타입
 * @param {string} fromBinding - 이전 바인딩 ('chat' 또는 'character')
 * @param {string} toBinding - 새 바인딩 ('chat' 또는 'character')
 * @returns {boolean} 성공 여부
 */
export function changeBinding(dataType, fromBinding, toBinding) {
    try {
        // 기존 데이터 불러오기
        const data = loadData(dataType, fromBinding);
        
        if (data) {
            // 새 바인딩으로 저장
            saveData(dataType, data, toBinding);
            // 기존 바인딩 데이터 삭제
            deleteData(dataType, fromBinding);
        }
        
        console.log(`[ST-LifeSim Storage] Changed ${dataType} binding: ${fromBinding} → ${toBinding}`);
        return true;
    } catch (error) {
        console.error(`[ST-LifeSim Storage] Failed to change binding:`, error);
        return false;
    }
}

/**
 * 스토리지 초기화
 */
export function initializeStorage() {
    console.log('[ST-LifeSim Storage] Storage system initialized');
    
    // 현재 컨텍스트 정보 로깅
    const chatId = getCurrentChatId();
    const characterId = getCurrentCharacterId();
    console.log(`[ST-LifeSim Storage] Current context - Chat: ${chatId}, Character: ${characterId}`);
}

/**
 * 전체 데이터 백업
 * @returns {Object} 모든 LifeSim 데이터
 */
export function backupAllData() {
    try {
        const backup = {};
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('lifesim_')) {
                backup[key] = localStorage.getItem(key);
            }
        }
        
        console.log('[ST-LifeSim Storage] Backup created');
        return backup;
    } catch (error) {
        console.error('[ST-LifeSim Storage] Failed to create backup:', error);
        return {};
    }
}

/**
 * 데이터 복원
 * @param {Object} backup - 백업 데이터
 * @returns {boolean} 성공 여부
 */
export function restoreData(backup) {
    try {
        Object.keys(backup).forEach(key => {
            if (key.startsWith('lifesim_')) {
                localStorage.setItem(key, backup[key]);
            }
        });
        
        console.log('[ST-LifeSim Storage] Data restored');
        return true;
    } catch (error) {
        console.error('[ST-LifeSim Storage] Failed to restore data:', error);
        return false;
    }
}
