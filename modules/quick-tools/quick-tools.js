/* ============================================================================
 * quick-tools.js - 퀵 도구 모음 (Quick Tools Module)
 * ============================================================================
 * 채팅창 툴바에 직접 추가되는 빠른 도구들
 * - 퀵센드: AI 응답 없이 메시지 전송
 * - 구분선: 시간 경과 표시
 * - 읽씹 연출: 읽음 표시 후 묘사
 * - 연락 안됨: 연결 안됨 연출
 * - 사건 생성기: 랜덤 이벤트 생성
 * - 음성메모: 음성 메시지 연출
 * ========================================================================== */

import { storage } from '../../utils/storage.js';
import { send, gen, genAs, getCurrentCharacterName } from '../../utils/slash.js';
import { showDropdown, showSuccess, showError, createElement } from '../../utils/ui.js';
import { prompt, confirm } from '../../utils/popup.js';

let toolbar = null;
let eventArchive = [];

/**
 * 모듈 초기화
 */
export async function init() {
    console.log('[QuickTools] 모듈 초기화...');
    
    // 이벤트 아카이브 로드
    loadEventArchive();
    
    // 툴바는 더 이상 생성하지 않음 (플로팅 메뉴로 대체)
    // createToolbar();
    
    // 단축키 등록 (퀵센드는 index.js에서 처리)
    // registerHotkeys();
    
    console.log('[QuickTools] 모듈 초기화 완료');
}

/**
 * 모듈 정리
 */
export function cleanup() {
    // 툴바 제거 로직 제거됨
    // if (toolbar) {
    //     toolbar.remove();
    //     toolbar = null;
    // }
    
    // 단축키 해제
    // unregisterHotkeys();
}

/**
 * 툴바 생성
 */
function createToolbar() {
    // 기존 툴바 제거
    const existing = document.querySelector('#stls-quick-toolbar');
    if (existing) {
        existing.remove();
    }
    
    // 채팅 입력창 찾기
    const chatInput = document.querySelector('#send_textarea') || document.querySelector('#chat_textarea');
    if (!chatInput) {
        console.warn('[QuickTools] 채팅 입력창을 찾을 수 없습니다.');
        return;
    }
    
    // 툴바 컨테이너 생성
    toolbar = createElement('div', {
        id: 'stls-quick-toolbar',
        className: 'stls-toolbar',
        style: {
            marginBottom: '10px'
        }
    });
    
    // 버튼들 생성
    const buttons = [
        { id: 'quick-send', icon: '📨', text: '퀵센드', onClick: handleQuickSend, tooltip: 'Ctrl+Shift+Enter' },
        { id: 'time-divider', icon: '⏱️', text: '구분선', onClick: handleTimeDivider },
        { id: 'read-receipt', icon: '👻', text: '읽씹', onClick: handleReadReceipt },
        { id: 'unreachable', icon: '📵', text: '연락안됨', onClick: handleUnreachable },
        { id: 'event-gen', icon: '⚡', text: '사건생성', onClick: handleEventGenerator },
        { id: 'voice-memo', icon: '🎤', text: '음성메모', onClick: handleVoiceMemo },
        { id: 'event-archive', icon: '📜', text: '사건기록', onClick: showEventArchive }
    ];
    
    buttons.forEach(btn => {
        const button = createElement('button', {
            className: 'stls-toolbar-btn',
            title: btn.tooltip || btn.text,
            onClick: btn.onClick
        }, `${btn.icon} ${btn.text}`);
        
        toolbar.appendChild(button);
    });
    
    // 툴바 삽입
    chatInput.parentElement.insertBefore(toolbar, chatInput);
}

/**
 * 퀵센드: 입력창 내용을 AI 응답 없이 전송
 */
async function handleQuickSend() {
    const chatInput = document.querySelector('#send_textarea') || document.querySelector('#chat_textarea');
    if (!chatInput) return;
    
    const message = chatInput.value.trim();
    if (!message) {
        showError('전송할 메시지를 입력해주세요.');
        return;
    }
    
    try {
        await send(message);
        chatInput.value = '';
        showSuccess('메시지를 전송했습니다.');
    } catch (error) {
        console.error('[QuickTools] 퀵센드 오류:', error);
        showError('메시지 전송 실패: ' + error.message);
    }
}

/**
 * 시간 구분선
 */
async function handleTimeDivider(event) {
    const options = [
        { text: '30분 후', value: '30분 후' },
        { text: '1시간 후', value: '1시간 후' },
        { text: '3시간 후', value: '3시간 후' },
        { text: '다음날', value: '다음날' },
        { text: '1주일 후', value: '1주일 후' },
        { text: '직접 입력', value: 'custom' }
    ];
    
    // 드롭다운 표시
    showDropdown(
        options.map(opt => ({
            text: opt.text,
            onClick: async () => {
                let timeText = opt.value;
                
                if (opt.value === 'custom') {
                    timeText = await prompt('시간을 입력하세요:', '');
                    if (!timeText) return;
                }
                
                const divider = `─────────── ${timeText} ───────────`;
                
                try {
                    await send(divider);
                    showSuccess('구분선을 삽입했습니다.');
                } catch (error) {
                    showError('구분선 삽입 실패: ' + error.message);
                }
            }
        })),
        event.pageX,
        event.pageY
    );
}

/**
 * 읽씹 연출
 */
async function handleReadReceipt() {
    try {
        const charName = getCurrentCharacterName();
        
        // 1. 읽음 표시 삽입
        await send('읽음 ✓✓');
        
        // 2. AI에게 읽씹 상황 묘사 요청
        setTimeout(async () => {
            await genAs(
                `${charName}는 메시지를 읽었지만 아직 답장하지 않은 상황을 짧게 묘사하라.`,
                charName
            );
        }, 500);
        
        showSuccess('읽씹 연출을 시작했습니다.');
    } catch (error) {
        console.error('[QuickTools] 읽씹 연출 오류:', error);
        showError('읽씹 연출 실패: ' + error.message);
    }
}

/**
 * 연락 안됨 연출
 */
async function handleUnreachable() {
    try {
        const charName = getCurrentCharacterName();
        
        // 1. 연결 안됨 표시
        await send('📵 연결되지 않습니다');
        
        // 2. AI에게 연락 안됨 상황 묘사 요청
        setTimeout(async () => {
            await genAs(
                `${charName}에게 연락이 닿지 않는다. 전화를 받지 않거나 메시지 미확인 상태인 상황을 짧게 묘사하라.`,
                charName
            );
        }, 500);
        
        showSuccess('연락 안됨 연출을 시작했습니다.');
    } catch (error) {
        console.error('[QuickTools] 연락 안됨 연출 오류:', error);
        showError('연락 안됨 연출 실패: ' + error.message);
    }
}

/**
 * 사건 생성기
 */
async function handleEventGenerator(event) {
    const categories = [
        { text: '📰 일상', value: '일상' },
        { text: '💼 직장/학교', value: '직장/학교' },
        { text: '❤️ 관계', value: '관계' },
        { text: '🌧️ 사고', value: '사고' },
        { text: '🎉 좋은일', value: '좋은일' },
        { text: '⚡ 긴급', value: '긴급' },
        { text: '🎲 랜덤', value: '랜덤' }
    ];
    
    // 드롭다운 표시
    showDropdown(
        categories.map(cat => ({
            text: cat.text,
            onClick: async () => {
                try {
                    const charName = getCurrentCharacterName();
                    const category = cat.value;
                    
                    // AI에게 사건 생성 요청
                    await genAs(
                        `${category} 분류의 사건이 발생했다. 현재 상황에 어울리는 사건을 간결하게 묘사하라.`,
                        charName
                    );
                    
                    // 사건 기록에 추가 (나중에 메시지 수신 시 업데이트)
                    eventArchive.push({
                        id: Date.now().toString(),
                        category,
                        date: new Date().toISOString(),
                        included: true
                    });
                    
                    saveEventArchive();
                    showSuccess('사건을 생성했습니다.');
                } catch (error) {
                    showError('사건 생성 실패: ' + error.message);
                }
            }
        })),
        event.pageX,
        event.pageY
    );
}

/**
 * 음성메모 연출
 */
async function handleVoiceMemo() {
    try {
        // 길이 입력 받기
        const duration = await prompt('음성메시지 길이(초):', '23');
        if (!duration) return;
        
        // 내용 힌트 입력 받기 (선택)
        const hint = await prompt('내용 힌트 (선택사항):', '');
        
        // 음성메시지 표시
        const seconds = parseInt(duration) || 23;
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        const timeStr = minutes > 0 ? `${minutes}:${secs.toString().padStart(2, '0')}` : `0:${secs}`;
        
        await send(`🎤 음성메시지 (${timeStr})`);
        
        // 힌트가 있으면 AI 응답 생성
        if (hint && hint.trim()) {
            const charName = getCurrentCharacterName();
            setTimeout(async () => {
                await genAs(
                    `${charName}에게 음성메시지가 도착했다. 내용: ${hint}. 이에 반응하라.`,
                    charName
                );
            }, 500);
        }
        
        showSuccess('음성메시지를 보냈습니다.');
    } catch (error) {
        console.error('[QuickTools] 음성메모 오류:', error);
        showError('음성메모 실패: ' + error.message);
    }
}

/**
 * 사건 기록 아카이브 표시
 */
function showEventArchive() {
    const { createPopup } = require('../../utils/popup.js');
    
    const content = createElement('div');
    
    if (eventArchive.length === 0) {
        content.innerHTML = '<p class="stls-text-muted">저장된 사건 기록이 없습니다.</p>';
    } else {
        content.innerHTML = '<div class="stls-flex stls-flex-col stls-gap-sm">';
        
        eventArchive.reverse().forEach(event => {
            const date = new Date(event.date);
            const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
            
            const item = createElement('div', {
                style: {
                    padding: '12px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '8px',
                    borderLeft: '3px solid ' + (event.included ? '#4a9eff' : '#666')
                }
            });
            
            item.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <strong>${event.category}</strong>
                    <span class="stls-text-sm stls-text-muted">${dateStr}</span>
                </div>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <label style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
                        <input type="checkbox" ${event.included ? 'checked' : ''} data-event-id="${event.id}" class="event-toggle" />
                        컨텍스트 포함
                    </label>
                </div>
            `;
            
            content.appendChild(item);
        });
    }
    
    const popup = createPopup({
        title: '📜 사건 기록',
        content,
        buttons: [
            {
                text: '전체 삭제',
                className: 'stls-btn-danger',
                onClick: async () => {
                    const confirmed = await confirm('모든 사건 기록을 삭제하시겠습니까?');
                    if (confirmed) {
                        eventArchive = [];
                        saveEventArchive();
                        popup.close();
                        showSuccess('사건 기록을 삭제했습니다.');
                    }
                },
                closeOnClick: false
            },
            {
                text: '닫기',
                className: 'stls-btn-secondary'
            }
        ],
        width: '600px'
    });
    
    // 토글 이벤트
    content.querySelectorAll('.event-toggle').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const eventId = e.target.dataset.eventId;
            const event = eventArchive.find(ev => ev.id === eventId);
            if (event) {
                event.included = e.target.checked;
                saveEventArchive();
            }
        });
    });
}

/**
 * 사건 아카이브 로드
 */
function loadEventArchive() {
    eventArchive = storage.getData('quickTools', 'eventArchive', [], 'chat');
}

/**
 * 사건 아카이브 저장
 */
function saveEventArchive() {
    storage.setData('quickTools', 'eventArchive', eventArchive, 'chat');
}

/**
 * 단축키 등록
 */
function registerHotkeys() {
    document.addEventListener('keydown', handleKeyDown);
}

/**
 * 단축키 해제
 */
function unregisterHotkeys() {
    document.removeEventListener('keydown', handleKeyDown);
}

/**
 * 키보드 이벤트 핸들러
 */
function handleKeyDown(event) {
    // Ctrl+Shift+Enter: 퀵센드
    if (event.ctrlKey && event.shiftKey && event.key === 'Enter') {
        event.preventDefault();
        handleQuickSend();
    }
}

export default {
    init,
    cleanup,
    handleTimeDivider,
    handleReadReceipt,
    handleUnreachable,
    handleEventGenerator,
    handleVoiceMemo,
    showEventArchive
};
};
