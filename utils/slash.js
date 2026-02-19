/**
 * ST-LifeSim 슬래시 커맨드 래퍼
 * SillyTavern의 슬래시 커맨드를 래핑하여 사용하기 쉽게 만듦
 * 
 * 사용 가능한 커맨드:
 * - /send: 유저 말풍선으로 메시지 전송
 * - /sendas: 특정 캐릭터 이름으로 메시지 전송
 * - /echo: 시스템 알림 (캐릭터 없음)
 * - /gen: AI 응답 생성
 */

let slashCommandsAvailable = false;

/**
 * 슬래시 커맨드 시스템 초기화
 */
export function initializeSlashCommands() {
    console.log('[ST-LifeSim Slash] Initializing slash command wrappers...');
    
    // SillyTavern의 슬래시 커맨드 시스템이 준비되었는지 확인
    if (typeof executeSlashCommands === 'function') {
        slashCommandsAvailable = true;
        console.log('[ST-LifeSim Slash] Slash commands are available');
    } else {
        console.warn('[ST-LifeSim Slash] Slash commands not available - falling back to direct message insertion');
    }
}

/**
 * 슬래시 커맨드 실행 (내부 헬퍼)
 * @param {string} command - 실행할 슬래시 커맨드
 * @returns {Promise<void>}
 */
async function executeCommand(command) {
    if (slashCommandsAvailable && typeof executeSlashCommands === 'function') {
        try {
            await executeSlashCommands(command);
        } catch (error) {
            console.error('[ST-LifeSim Slash] Failed to execute command:', command, error);
        }
    } else {
        // Fallback: 직접 메시지 추가 (SillyTavern API 사용)
        console.warn('[ST-LifeSim Slash] Using fallback method for:', command);
        // 실제 구현은 SillyTavern API에 따라 조정 필요
    }
}

/**
 * 유저 말풍선으로 메시지 전송 (AI 응답 없음)
 * @param {string} text - 전송할 텍스트
 * @returns {Promise<void>}
 */
export async function sendMessage(text) {
    if (!text) {
        console.warn('[ST-LifeSim Slash] sendMessage: text is empty');
        return;
    }
    
    const command = `/send ${text}`;
    console.log('[ST-LifeSim Slash] Executing:', command);
    await executeCommand(command);
}

/**
 * 특정 캐릭터 이름으로 메시지 전송 (AI 생성 없이 바로)
 * @param {string} characterName - 캐릭터 이름
 * @param {string} text - 전송할 텍스트
 * @returns {Promise<void>}
 */
export async function sendAsCharacter(characterName, text) {
    if (!characterName || !text) {
        console.warn('[ST-LifeSim Slash] sendAsCharacter: missing parameters');
        return;
    }
    
    const command = `/sendas name="${characterName}" ${text}`;
    console.log('[ST-LifeSim Slash] Executing:', command);
    await executeCommand(command);
}

/**
 * 시스템 알림 (캐릭터 없는 메시지)
 * @param {string} text - 알림 텍스트
 * @returns {Promise<void>}
 */
export async function echoMessage(text) {
    if (!text) {
        console.warn('[ST-LifeSim Slash] echoMessage: text is empty');
        return;
    }
    
    const command = `/echo ${text}`;
    console.log('[ST-LifeSim Slash] Executing:', command);
    await executeCommand(command);
}

/**
 * AI 응답 생성 (기본 캐릭터)
 * @param {string} prompt - 생성 프롬프트
 * @returns {Promise<void>}
 */
export async function generateResponse(prompt) {
    if (!prompt) {
        console.warn('[ST-LifeSim Slash] generateResponse: prompt is empty');
        return;
    }
    
    const command = `/gen ${prompt}`;
    console.log('[ST-LifeSim Slash] Executing:', command);
    await executeCommand(command);
}

/**
 * AI 응답 생성 후 특정 캐릭터로 전송
 * @param {string} characterName - 캐릭터 이름
 * @param {string} prompt - 생성 프롬프트
 * @returns {Promise<void>}
 */
export async function generateAndSendAs(characterName, prompt) {
    if (!characterName || !prompt) {
        console.warn('[ST-LifeSim Slash] generateAndSendAs: missing parameters');
        return;
    }
    
    const command = `/gen ${prompt} | /sendas name="${characterName}"`;
    console.log('[ST-LifeSim Slash] Executing:', command);
    await executeCommand(command);
}

/**
 * 구분선 삽입
 * @param {string} text - 구분선 텍스트 (선택)
 * @returns {Promise<void>}
 */
export async function insertDivider(text = '') {
    const dividerText = text ? `─────────── ${text} ───────────` : '─────────────────────────────';
    await sendMessage(dividerText);
}

/**
 * 읽음 표시 삽입
 * @returns {Promise<void>}
 */
export async function insertReadReceipt() {
    await sendMessage('읽음 ✓✓');
}

/**
 * 연락 안 됨 표시 삽입
 * @returns {Promise<void>}
 */
export async function insertUnavailable() {
    await sendMessage('📵 연결되지 않습니다');
}

/**
 * 통화 시작 마커 삽입
 * @param {string} characterName - 통화 대상 이름
 * @returns {Promise<void>}
 */
export async function insertCallStart(characterName) {
    await sendMessage(`📞 통화 시작 — ${characterName}`);
}

/**
 * 통화 종료 마커 삽입
 * @param {number} durationSeconds - 통화 시간 (초)
 * @returns {Promise<void>}
 */
export async function insertCallEnd(durationSeconds) {
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;
    const timeStr = `${minutes}분 ${seconds.toString().padStart(2, '0')}초`;
    await sendMessage(`📵 통화 종료 (통화시간: ${timeStr})`);
}

/**
 * 음성메시지 마커 삽입
 * @param {number} durationSeconds - 음성메시지 길이 (초)
 * @returns {Promise<void>}
 */
export async function insertVoiceMemo(durationSeconds) {
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;
    let timeStr;
    
    if (minutes > 0) {
        timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    } else {
        timeStr = `0:${seconds.toString().padStart(2, '0')}`;
    }
    
    await sendMessage(`🎤 음성메시지 (${timeStr})`);
}

/**
 * 송금 완료 메시지 삽입
 * @param {Object} transferInfo - 송금 정보
 * @param {string} transferInfo.recipient - 받는 사람
 * @param {string} transferInfo.amount - 금액
 * @param {string} transferInfo.balance - 잔액
 * @param {string} transferInfo.currencySymbol - 화폐 기호
 * @param {string} transferInfo.date - 날짜/시간
 * @returns {Promise<void>}
 */
export async function insertTransferMessage(transferInfo) {
    const { recipient, amount, balance, currencySymbol, date } = transferInfo;
    
    const message = `━━━━━━━━━━━━
💸 송금 완료
━━━━━━━━━━━━
받는 분: ${recipient}
금  액: ${currencySymbol} ${amount}
잔  액: ${currencySymbol} ${balance}
일  시: ${date}
━━━━━━━━━━━━`;
    
    await sendMessage(message);
}

/**
 * 이모티콘 전송
 * @param {string} name - 이모티콘 이름
 * @param {string} url - 이모티콘 URL
 * @returns {Promise<void>}
 */
export async function sendEmoticon(name, url) {
    await sendMessage(`![${name}](${url})`);
}

/**
 * 사건 생성 (AI 생성)
 * @param {string} characterName - 캐릭터 이름 ({{char}} 사용)
 * @param {string} category - 사건 카테고리
 * @returns {Promise<void>}
 */
export async function generateEvent(characterName, category) {
    const categoryMap = {
        '일상': '일상',
        '직장/학교': '직장/학교',
        '관계': '관계',
        '사고': '사고',
        '좋은일': '좋은 일',
        '긴급': '긴급',
        '랜덤': '랜덤'
    };
    
    const categoryText = categoryMap[category] || category;
    const prompt = `${categoryText} 분류의 사건이 발생했다. 현재 상황에 어울리는 사건을 간결하게 묘사하라.`;
    
    await generateAndSendAs(characterName, prompt);
}

/**
 * 읽씹 연출 실행
 * @param {string} characterName - 캐릭터 이름
 * @returns {Promise<void>}
 */
export async function executeReadReceiptScene(characterName) {
    // 1. 읽음 표시
    await insertReadReceipt();
    
    // 2. AI 응답 생성 (읽었지만 답장 안 함)
    const prompt = `{{char}}는 메시지를 읽었지만 아직 답장하지 않은 상황을 짧게 묘사하라.`;
    await generateAndSendAs(characterName, prompt);
}

/**
 * 연락 안 됨 연출 실행
 * @param {string} characterName - 캐릭터 이름
 * @returns {Promise<void>}
 */
export async function executeUnavailableScene(characterName) {
    // 1. 연락 안 됨 표시
    await insertUnavailable();
    
    // 2. AI 응답 생성
    const prompt = `{{char}}에게 연락이 닿지 않는다. 전화를 받지 않거나 메시지 미확인 상태인 상황을 짧게 묘사하라.`;
    await generateAndSendAs(characterName, prompt);
}

/**
 * 음성메모 힌트와 함께 AI 응답 생성
 * @param {string} characterName - 캐릭터 이름
 * @param {string} hint - 음성메모 내용 힌트
 * @returns {Promise<void>}
 */
export async function generateVoiceMemoResponse(characterName, hint) {
    if (hint) {
        const prompt = `{{char}}에게 음성메시지가 도착했다. 내용: ${hint}. 이에 반응하라.`;
        await generateAndSendAs(characterName, prompt);
    }
}
