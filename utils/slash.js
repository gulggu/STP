/* ===========================================
   slash.js - 슬래시 커맨드 래퍼 함수
   =========================================== */

/**
 * 유저 메시지로 텍스트를 전송 (AI 응답 없음)
 * @param {string} text - 전송할 텍스트
 */
async function sendMessage(text) {
    if (!text) return;
    
    try {
        // SillyTavern의 executeSlashCommands 함수 사용
        const command = `/send ${text}`;
        console.log('[ST-LifeSim] 실행:', command);
        await window.executeSlashCommands?.(command);
    } catch (error) {
        console.error('[ST-LifeSim] /send 실행 실패:', error);
    }
}

/**
 * 특정 캐릭터 이름으로 메시지 전송 (AI 응답 없음)
 * @param {string} name - 캐릭터 이름
 * @param {string} text - 전송할 텍스트
 */
async function sendAsCharacter(name, text) {
    if (!name || !text) return;
    
    try {
        const command = `/sendas name="${name}" ${text}`;
        console.log('[ST-LifeSim] 실행:', command);
        await window.executeSlashCommands?.(command);
    } catch (error) {
        console.error('[ST-LifeSim] /sendas 실행 실패:', error);
    }
}

/**
 * 시스템 알림 메시지 전송 (캐릭터 없음)
 * @param {string} text - 전송할 텍스트
 */
async function echoMessage(text) {
    if (!text) return;
    
    try {
        const command = `/echo ${text}`;
        console.log('[ST-LifeSim] 실행:', command);
        await window.executeSlashCommands?.(command);
    } catch (error) {
        console.error('[ST-LifeSim] /echo 실행 실패:', error);
    }
}

/**
 * AI 응답 생성 후 특정 캐릭터로 전송
 * @param {string} prompt - 생성 프롬프트
 * @param {string} name - 캐릭터 이름 (선택사항, 없으면 기본 char)
 */
async function generateAndSend(prompt, name = null) {
    if (!prompt) return;
    
    try {
        let command;
        if (name) {
            command = `/gen ${prompt} | /sendas name="${name}"`;
        } else {
            command = `/gen ${prompt}`;
        }
        console.log('[ST-LifeSim] 실행:', command);
        await window.executeSlashCommands?.(command);
    } catch (error) {
        console.error('[ST-LifeSim] /gen 실행 실패:', error);
    }
}

/**
 * 일반 슬래시 커맨드 실행
 * @param {string} command - 실행할 커맨드
 */
async function executeCommand(command) {
    if (!command) return;
    
    try {
        console.log('[ST-LifeSim] 실행:', command);
        await window.executeSlashCommands?.(command);
    } catch (error) {
        console.error('[ST-LifeSim] 커맨드 실행 실패:', error);
    }
}

/**
 * 현재 캐릭터 이름 가져오기
 * @returns {string} 캐릭터 이름
 */
function getCurrentCharacterName() {
    const context = window.SillyTavern?.getContext();
    return context?.name2 || context?.characterName || '{{char}}';
}

/**
 * 사용자 이름 가져오기
 * @returns {string} 사용자 이름
 */
function getUserName() {
    const context = window.SillyTavern?.getContext();
    return context?.name1 || '{{user}}';
}

// 외부로 내보내기
window.STLifeSimSlash = {
    sendMessage,
    sendAsCharacter,
    echoMessage,
    generateAndSend,
    executeCommand,
    getCurrentCharacterName,
    getUserName
};
