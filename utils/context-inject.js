/* ============================================================================
 * context-inject.js - 컨텍스트 통합 주입 시스템
 * ============================================================================
 * World Info 대신 프롬프트에 직접 컨텍스트를 주입
 * 모든 모듈의 활성 데이터를 하나의 블록으로 통합하여 매 턴 주입
 * ========================================================================== */

import { storage } from './storage.js';

/**
 * 컨텍스트 주입 관리자
 */
export class ContextInjector {
    constructor() {
        this.injectors = new Map();
        this.enabled = true;
    }

    /**
     * 모듈의 컨텍스트 주입 함수 등록
     * @param {string} moduleName - 모듈 이름
     * @param {Function} injectorFunc - 컨텍스트 생성 함수 (반환: string 또는 null)
     */
    register(moduleName, injectorFunc) {
        this.injectors.set(moduleName, injectorFunc);
    }

    /**
     * 모듈 컨텍스트 주입 해제
     * @param {string} moduleName - 모듈 이름
     */
    unregister(moduleName) {
        this.injectors.delete(moduleName);
    }

    /**
     * 모든 활성 모듈의 컨텍스트를 통합하여 생성
     * @returns {string} 통합 컨텍스트 블록
     */
    generateContext() {
        if (!this.enabled) {
            return '';
        }

        const sections = [];

        // 각 모듈의 컨텍스트 생성
        for (const [moduleName, injectorFunc] of this.injectors.entries()) {
            try {
                // 모듈이 활성화되어 있는지 확인
                if (!storage.isModuleEnabled(moduleName)) {
                    continue;
                }

                // 컨텍스트 생성
                const context = injectorFunc();
                
                // 컨텍스트가 있으면 추가
                if (context && context.trim()) {
                    sections.push(context.trim());
                }
            } catch (error) {
                console.error(`[ST-LifeSim] ${moduleName} 컨텍스트 생성 오류:`, error);
            }
        }

        // 섹션이 없으면 빈 문자열 반환
        if (sections.length === 0) {
            return '';
        }

        // 통합 블록 생성
        const fullContext = [
            '[ST-LifeSim 컨텍스트]',
            ...sections,
            '[/ST-LifeSim 컨텍스트]'
        ].join('\n\n');

        return fullContext;
    }

    /**
     * SillyTavern 이벤트 훅에 컨텍스트 주입
     * 메시지 전송 전 프롬프트에 컨텍스트 추가
     */
    hookIntoSillyTavern() {
        // SillyTavern의 이벤트 시스템 활용
        if (window.eventSource) {
            // CHAT_CHANGED 이벤트에서 컨텍스트 업데이트
            window.eventSource.on('chatLoaded', () => {
                this.injectContext();
            });

            // MESSAGE_SENT 이벤트 전에 컨텍스트 주입
            window.eventSource.on('messageSending', () => {
                this.injectContext();
            });
        }

        // 또는 setInterval로 주기적 주입 (fallback)
        setInterval(() => {
            this.injectContext();
        }, 5000);
    }

    /**
     * 실제 컨텍스트 주입 실행
     * SillyTavern의 채팅 컨텍스트에 추가
     */
    injectContext() {
        const context = this.generateContext();
        
        if (!context) {
            return;
        }

        // SillyTavern API를 통해 프롬프트에 주입
        // 방법 1: extension_prompt 사용
        if (window.setExtensionPrompt) {
            window.setExtensionPrompt('st-lifesim', context, 1, 0);
        }
        
        // 방법 2: 직접 컨텍스트 객체 수정
        const stContext = window.SillyTavern?.getContext?.();
        if (stContext && !window.setExtensionPrompt) {
            // extension_prompts 배열에 추가
            if (!stContext.extension_prompts) {
                stContext.extension_prompts = [];
            }
            
            // 기존 ST-LifeSim 프롬프트 제거
            stContext.extension_prompts = stContext.extension_prompts.filter(
                p => p.identifier !== 'st-lifesim'
            );
            
            // 새 프롬프트 추가
            stContext.extension_prompts.push({
                identifier: 'st-lifesim',
                value: context,
                position: 1, // 0=before_main, 1=after_main
                depth: 0
            });
        }
    }

    /**
     * 컨텍스트 활성화/비활성화
     * @param {boolean} enabled - 활성화 여부
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            // 비활성화 시 컨텍스트 제거
            if (window.setExtensionPrompt) {
                window.setExtensionPrompt('st-lifesim', '', 1, 0);
            }
        }
    }

    /**
     * 현재 컨텍스트 토큰 수 추정
     * @returns {number} 대략적인 토큰 수
     */
    estimateTokens() {
        const context = this.generateContext();
        // 간단한 토큰 추정: 단어 수 * 1.3 (한글 포함)
        const words = context.split(/\s+/).length;
        return Math.ceil(words * 1.3);
    }

    /**
     * 모듈별 컨텍스트 상태 확인
     * @returns {Object} 모듈별 상태 {moduleName: {enabled, hasContext, tokenEstimate}}
     */
    getModuleStatus() {
        const status = {};

        for (const [moduleName, injectorFunc] of this.injectors.entries()) {
            const enabled = storage.isModuleEnabled(moduleName);
            let context = '';
            let tokenEstimate = 0;

            if (enabled) {
                try {
                    context = injectorFunc() || '';
                    const words = context.split(/\s+/).length;
                    tokenEstimate = Math.ceil(words * 1.3);
                } catch (error) {
                    console.error(`[ST-LifeSim] ${moduleName} 상태 확인 오류:`, error);
                }
            }

            status[moduleName] = {
                enabled,
                hasContext: context.trim().length > 0,
                tokenEstimate
            };
        }

        return status;
    }
}

// 싱글톤 인스턴스 생성
export const contextInjector = new ContextInjector();

/**
 * 헬퍼: 섹션 포맷팅
 * @param {string} title - 섹션 제목
 * @param {Array<string>} items - 항목 배열
 * @returns {string} 포맷된 섹션
 */
export function formatSection(title, items) {
    if (!items || items.length === 0) {
        return '';
    }
    
    const lines = [
        `=== ${title} ===`,
        ...items.map(item => `• ${item}`)
    ];
    
    return lines.join('\n');
}

/**
 * 헬퍼: 키-값 쌍 포맷팅
 * @param {Object} data - 데이터 객체
 * @returns {Array<string>} 포맷된 라인 배열
 */
export function formatKeyValue(data) {
    return Object.entries(data).map(([key, value]) => `${key}: ${value}`);
}

export default {
    contextInjector,
    formatSection,
    formatKeyValue
};
