/* ============================================================================
 * slash.js - 슬래시 커맨드 래퍼 함수
 * ============================================================================
 * SillyTavern의 슬래시 커맨드를 쉽게 사용하기 위한 유틸리티 함수들
 * /send, /sendas, /echo, /gen 등의 커맨드를 프로그래밍 방식으로 실행
 * ========================================================================== */

/**
 * 슬래시 커맨드 실행
 * @param {string} command - 실행할 전체 커맨드 (예: "/send 안녕하세요")
 * @returns {Promise<any>}
 */
async function executeSlashCommand(command) {
    if (window.executeSlashCommands) {
        return await window.executeSlashCommands(command);
    } else {
        console.error('[ST-LifeSim] executeSlashCommands 함수를 찾을 수 없습니다.');
        throw new Error('SillyTavern API not available');
    }
}

/**
 * 유저 말풍선으로 메시지 전송 (AI 응답 없음)
 * @param {string} message - 전송할 메시지
 * @returns {Promise<any>}
 */
export async function send(message) {
    // 이스케이프 처리: 파이프 문자 등을 보호
    const escaped = message.replace(/\|/g, '\\|');
    return await executeSlashCommand(`/send ${escaped}`);
}

/**
 * 특정 캐릭터 이름으로 메시지 전송 (AI 응답 없이 바로 출력)
 * @param {string} name - 캐릭터 이름
 * @param {string} message - 전송할 메시지
 * @returns {Promise<any>}
 */
export async function sendAs(name, message) {
    const escaped = message.replace(/\|/g, '\\|');
    return await executeSlashCommand(`/sendas name="${name}" ${escaped}`);
}

/**
 * 시스템 알림 메시지 (캐릭터 없는 에코)
 * @param {string} message - 알림 메시지
 * @returns {Promise<any>}
 */
export async function echo(message) {
    const escaped = message.replace(/\|/g, '\\|');
    return await executeSlashCommand(`/echo ${escaped}`);
}

/**
 * AI 생성 요청 (단독 사용 시 기본 캐릭터 응답)
 * @param {string} prompt - 생성 프롬프트
 * @returns {Promise<any>}
 */
export async function gen(prompt) {
    const escaped = prompt.replace(/\|/g, '\\|');
    return await executeSlashCommand(`/gen ${escaped}`);
}

/**
 * AI 생성 후 특정 이름으로 전송
 * @param {string} prompt - 생성 프롬프트
 * @param {string} name - 출력할 캐릭터 이름
 * @returns {Promise<any>}
 */
export async function genAs(prompt, name) {
    const escapedPrompt = prompt.replace(/\|/g, '\\|');
    return await executeSlashCommand(`/gen ${escapedPrompt} | /sendas name="${name}"`);
}

/**
 * 현재 캐릭터 이름 가져오기
 * @returns {string}
 */
export function getCurrentCharacterName() {
    const context = window.SillyTavern?.getContext?.();
    if (context?.name2) {
        return context.name2;
    }
    return '{{char}}';
}

/**
 * 현재 유저 이름 가져오기
 * @returns {string}
 */
export function getCurrentUserName() {
    const context = window.SillyTavern?.getContext?.();
    if (context?.name1) {
        return context.name1;
    }
    return '{{user}}';
}

/**
 * 복합 커맨드 실행 (여러 슬래시 커맨드를 순차 실행)
 * @param {Array<string>} commands - 커맨드 배열
 * @param {number} delay - 각 커맨드 사이 지연시간 (ms)
 * @returns {Promise<void>}
 */
export async function executeSequence(commands, delay = 500) {
    for (const command of commands) {
        await executeSlashCommand(command);
        if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

/**
 * 메시지를 채팅창에 직접 추가 (슬래시 커맨드 사용 불가 시 대체)
 * @param {string} message - 메시지 내용
 * @param {string} type - 'user', 'character', 'system' 중 하나
 * @param {string} name - 캐릭터 이름 (type='character'일 때)
 */
export async function addMessage(message, type = 'system', name = null) {
    // SillyTavern API 활용 시도
    const context = window.SillyTavern?.getContext?.();
    
    if (context && typeof context.chat !== 'undefined') {
        const messageObj = {
            name: name || (type === 'user' ? context.name1 : context.name2),
            is_user: type === 'user',
            is_system: type === 'system',
            mes: message,
            send_date: new Date().toISOString()
        };
        
        context.chat.push(messageObj);
        
        // UI 업데이트 시도
        if (window.addOneMessage) {
            await window.addOneMessage(messageObj);
        }
    } else {
        console.error('[ST-LifeSim] 채팅 컨텍스트를 찾을 수 없습니다.');
    }
}

export default {
    send,
    sendAs,
    echo,
    gen,
    genAs,
    getCurrentCharacterName,
    getCurrentUserName,
    executeSequence,
    addMessage
};
