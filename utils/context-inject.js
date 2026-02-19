/**
 * ST-LifeSim 컨텍스트 주입 시스템
 * 프롬프트에 모듈 데이터를 통합하여 주입
 * World Info(Lorebook) 대신 직접 프롬프트에 삽입
 */

/**
 * 컨텍스트 주입 시스템 초기화
 */
export function initializeContextInjection() {
    console.log('[ST-LifeSim Context] Context injection system initialized');
    
    // SillyTavern 메시지 전송 이벤트에 훅 추가
    // 실제 구현은 SillyTavern API에 따라 조정 필요
    if (window.eventSource) {
        // MESSAGE_SENDING 이벤트에 컨텍스트 주입
        // window.eventSource.on('MESSAGE_SENDING', injectContext);
    }
}

/**
 * 모든 활성화된 모듈의 컨텍스트를 수집하여 통합 블록 생성
 * @returns {string} 통합 컨텍스트 블록
 */
export function buildContextBlock() {
    const sections = [];
    
    // 각 모듈의 컨텍스트 수집
    const contactsContext = buildContactsContext();
    const walletContext = buildWalletContext();
    const calendarContext = buildCalendarContext();
    const snsContext = buildSNSContext();
    const emoticonContext = buildEmoticonContext();
    
    // 데이터가 있는 섹션만 추가
    if (contactsContext) sections.push(contactsContext);
    if (walletContext) sections.push(walletContext);
    if (calendarContext) sections.push(calendarContext);
    if (snsContext) sections.push(snsContext);
    if (emoticonContext) sections.push(emoticonContext);
    
    // 섹션이 없으면 빈 문자열 반환
    if (sections.length === 0) {
        return '';
    }
    
    // 통합 블록 생성
    const contextBlock = `[ST-LifeSim 컨텍스트]
${sections.join('\n\n')}
[/ST-LifeSim 컨텍스트]`;
    
    return contextBlock;
}

/**
 * 주변 인물 (연락처) 컨텍스트 생성
 * @returns {string|null}
 */
function buildContactsContext() {
    // Module 2에서 구현 예정
    // 임시 구조
    if (!window.lifesim || !window.lifesim.state.modules.contacts.enabled) {
        return null;
    }
    
    // 연락처 데이터 불러오기
    // const contacts = loadData('contacts', binding);
    // if (!contacts || contacts.length === 0) return null;
    
    // 예시:
    // === 주변 인물 ===
    // • 홍길동 | {{user}}의 소꿉친구 | {{char}}와: 직장동료(서먹) | 성격: 유쾌하고 털털함
    
    return null; // 아직 구현 안 됨
}

/**
 * 지갑 컨텍스트 생성
 * @returns {string|null}
 */
function buildWalletContext() {
    // Module 5에서 구현 예정
    if (!window.lifesim || !window.lifesim.state.modules.wallet.enabled) {
        return null;
    }
    
    // 예시:
    // === 지갑 (골드 G) ===
    // 현재 잔액: G 1,250,000
    
    return null; // 아직 구현 안 됨
}

/**
 * 캘린더 컨텍스트 생성
 * @returns {string|null}
 */
function buildCalendarContext() {
    // Module 7에서 구현 예정
    if (!window.lifesim || !window.lifesim.state.modules.calendar.enabled) {
        return null;
    }
    
    // 예시:
    // === 오늘 일정 (15일) ===
    // • 12:00 홍길동과 점심 (강남역)
    // • D+3 {{char}}와 영화
    
    return null; // 아직 구현 안 됨
}

/**
 * SNS 피드 컨텍스트 생성
 * @returns {string|null}
 */
function buildSNSContext() {
    // Module 6에서 구현 예정
    if (!window.lifesim || !window.lifesim.state.modules.sns.enabled) {
        return null;
    }
    
    // 예시:
    // === 최근 SNS (컨텍스트 포함 설정 기준) ===
    // • 홍길동: "오늘도 커피로 시작 ☕" (15일)
    
    return null; // 아직 구현 안 됨
}

/**
 * AI 사용 가능 이모티콘 컨텍스트 생성
 * @returns {string|null}
 */
function buildEmoticonContext() {
    if (!window.lifesim || !window.lifesim.state.modules.emoticon.enabled) {
        return null;
    }
    
    // 이모티콘 모듈에서 AI 사용 가능한 이모티콘 가져오기
    try {
        // 동적 import를 통해 이모티콘 데이터 가져오기
        const emoticonModule = window.lifesimEmoticon;
        if (!emoticonModule || !emoticonModule.getAIUsableEmoticons) {
            return null;
        }
        
        const aiEmoticons = emoticonModule.getAIUsableEmoticons();
        if (!aiEmoticons || aiEmoticons.length === 0) {
            return null;
        }
        
        // 최대 10개까지만 컨텍스트에 포함 (토큰 절약)
        const limited = aiEmoticons.slice(0, 10);
        const emoticonList = limited.map(e => `${e.name}: ![${e.name}](${e.url})`).join(' | ');
        
        return `=== AI 사용 가능 이모티콘 ===\n${emoticonList}`;
    } catch (error) {
        console.warn('[ST-LifeSim Context] Failed to build emoticon context:', error);
        return null;
    }
}

/**
 * 컨텍스트를 프롬프트에 주입
 * @param {string} originalPrompt - 원본 프롬프트
 * @returns {string} 컨텍스트가 주입된 프롬프트
 */
export function injectContext(originalPrompt) {
    const contextBlock = buildContextBlock();
    
    if (!contextBlock) {
        return originalPrompt;
    }
    
    // 프롬프트 끝에 컨텍스트 추가
    return `${originalPrompt}\n\n${contextBlock}`;
}

/**
 * 컨텍스트 토큰 수 추정
 * @returns {Object} 각 섹션별 토큰 수 추정치
 */
export function estimateContextTokens() {
    // 간단한 토큰 추정 (1 토큰 ≈ 4 글자)
    const estimate = (text) => {
        if (!text) return 0;
        return Math.ceil(text.length / 4);
    };
    
    return {
        contacts: estimate(buildContactsContext()),
        wallet: estimate(buildWalletContext()),
        calendar: estimate(buildCalendarContext()),
        sns: estimate(buildSNSContext()),
        emoticon: estimate(buildEmoticonContext()),
        total: estimate(buildContextBlock())
    };
}

/**
 * 컨텍스트 미리보기 (디버깅/설정 확인용)
 * @returns {string}
 */
export function previewContext() {
    return buildContextBlock() || '[컨텍스트가 비어있습니다]';
}

/**
 * 특정 모듈의 컨텍스트만 생성
 * @param {string} moduleName - 모듈 이름
 * @returns {string|null}
 */
export function buildModuleContext(moduleName) {
    switch (moduleName) {
        case 'contacts':
            return buildContactsContext();
        case 'wallet':
            return buildWalletContext();
        case 'calendar':
            return buildCalendarContext();
        case 'sns':
            return buildSNSContext();
        case 'emoticon':
            return buildEmoticonContext();
        default:
            console.warn(`[ST-LifeSim Context] Unknown module: ${moduleName}`);
            return null;
    }
}
