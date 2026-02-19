/* ===========================================
   context-inject.js - 프롬프트 컨텍스트 주입
   =========================================== */

/**
 * 모든 모듈의 컨텍스트를 통합하여 반환
 * @returns {string} 통합 컨텍스트 문자열
 */
function generateContext() {
    const sections = [];
    
    // 각 모듈에서 컨텍스트 수집
    // 모듈이 활성화되어 있고 데이터가 있을 때만 추가
    
    // NPC 연락처 컨텍스트
    const contactsContext = window.STLifeSimContacts?.getContext?.();
    if (contactsContext) {
        sections.push(contactsContext);
    }
    
    // 지갑 컨텍스트
    const walletContext = window.STLifeSimWallet?.getContext?.();
    if (walletContext) {
        sections.push(walletContext);
    }
    
    // 캘린더 컨텍스트
    const calendarContext = window.STLifeSimCalendar?.getContext?.();
    if (calendarContext) {
        sections.push(calendarContext);
    }
    
    // SNS 컨텍스트
    const snsContext = window.STLifeSimSNS?.getContext?.();
    if (snsContext) {
        sections.push(snsContext);
    }
    
    // 통화 기록 컨텍스트
    const callContext = window.STLifeSimCall?.getContext?.();
    if (callContext) {
        sections.push(callContext);
    }
    
    // 이모티콘 컨텍스트
    const emoticonContext = window.STLifeSimEmoticon?.getContext?.();
    if (emoticonContext) {
        sections.push(emoticonContext);
    }
    
    // 사건 기록 컨텍스트
    const eventContext = window.STLifeSimQuickTools?.getEventContext?.();
    if (eventContext) {
        sections.push(eventContext);
    }
    
    // 섹션이 없으면 빈 문자열 반환
    if (sections.length === 0) {
        return '';
    }
    
    // 통합 컨텍스트 블록 생성
    const context = `[ST-LifeSim 컨텍스트]\n${sections.join('\n\n')}\n[/ST-LifeSim 컨텍스트]`;
    
    return context;
}

/**
 * 컨텍스트를 프롬프트에 주입
 * SillyTavern의 이벤트 시스템을 통해 메시지 전송 전에 호출됨
 */
function injectContext() {
    const context = generateContext();
    
    if (!context) {
        return;
    }
    
    // SillyTavern의 context 객체에 추가
    // 이 부분은 SillyTavern의 API에 따라 구현 방식이 달라질 수 있음
    try {
        const stContext = window.SillyTavern?.getContext();
        if (stContext) {
            // extension_prompt 또는 적절한 위치에 주입
            // 실제 구현은 SillyTavern API 문서 참조 필요
            console.log('[ST-LifeSim] 컨텍스트 주입:', context.length, '자');
        }
    } catch (error) {
        console.error('[ST-LifeSim] 컨텍스트 주입 실패:', error);
    }
}

/**
 * 컨텍스트 주입 이벤트 리스너 등록
 */
function registerContextInjection() {
    // SillyTavern의 메시지 전송 이벤트에 리스너 등록
    // 실제 이벤트명은 SillyTavern API 문서 참조 필요
    if (window.eventSource) {
        window.eventSource.on('CHAT_BEFORE_SEND', injectContext);
        console.log('[ST-LifeSim] 컨텍스트 주입 리스너 등록 완료');
    }
}

/**
 * 컨텍스트 주입 해제
 */
function unregisterContextInjection() {
    if (window.eventSource) {
        window.eventSource.removeListener('CHAT_BEFORE_SEND', injectContext);
        console.log('[ST-LifeSim] 컨텍스트 주입 리스너 해제');
    }
}

/**
 * 컨텍스트 토큰 수 추정
 * @param {string} text - 텍스트
 * @returns {number} 대략적인 토큰 수
 */
function estimateTokens(text) {
    // 간단한 추정: 영문 4글자당 1토큰, 한글 2글자당 1토큰
    const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
    const koreanChars = (text.match(/[가-힣]/g) || []).length;
    const otherChars = text.length - englishChars - koreanChars;
    
    return Math.ceil(englishChars / 4 + koreanChars / 2 + otherChars / 3);
}

/**
 * 전체 컨텍스트 토큰 수 반환
 * @returns {number} 토큰 수
 */
function getContextTokenCount() {
    const context = generateContext();
    return estimateTokens(context);
}

// 외부로 내보내기
window.STLifeSimContext = {
    generateContext,
    injectContext,
    registerContextInjection,
    unregisterContextInjection,
    estimateTokens,
    getContextTokenCount
};
