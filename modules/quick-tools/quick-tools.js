/**
 * ST-LifeSim 퀵 도구 모음 (Quick Tools)
 * 채팅창 툴바에 직접 통합되는 빠른 작업 도구들
 * 
 * 포함 기능:
 * 1. 퀵 센드 - AI 응답 없이 빠르게 메시지 전송
 * 2. 시간 구분선 - 시간 경과를 나타내는 구분선 삽입
 * 3. 읽씹 연출 - 읽음 표시 + AI 응답
 * 4. 연락 안 됨 연출 - 연결 불가 표시 + AI 응답
 * 5. 사건 생성기 - 카테고리별 랜덤 사건 생성
 * 6. 음성메모 - 음성메시지 삽입 및 힌트 제공
 */

import { 
    sendMessage, 
    insertDivider, 
    executeReadReceiptScene,
    executeUnavailableScene,
    generateEvent,
    insertVoiceMemo,
    generateVoiceMemoResponse
} from '../../utils/slash.js';
import { showInputDialog, showConfirmDialog } from '../../utils/popup.js';
import { showToast } from '../../utils/ui.js';
import { saveData, loadData } from '../../utils/storage.js';

// 사건 기록 저장소
let eventArchive = [];

/**
 * 퀵 도구 모듈 초기화
 */
export async function initializeQuickTools() {
    console.log('[ST-LifeSim Quick Tools] Initializing...');
    
    // CSS 로드
    loadQuickToolsCSS();
    
    // 저장된 사건 기록 불러오기
    const savedArchive = loadData('event_archive', 'chat', []);
    if (savedArchive) {
        eventArchive = savedArchive;
    }
    
    // 툴바 버튼 추가
    addQuickToolsToolbar();
    
    // 단축키 등록
    registerShortcuts();
    
    console.log('[ST-LifeSim Quick Tools] Initialized successfully');
}

/**
 * 퀵 도구 툴바를 채팅 UI에 추가
 */
function addQuickToolsToolbar() {
    // SillyTavern의 채팅 입력 영역 찾기
    const chatInput = document.getElementById('send_textarea') || document.querySelector('.mes_block');
    if (!chatInput) {
        console.warn('[ST-LifeSim Quick Tools] Could not find chat input area');
        return;
    }
    
    // 툴바가 이미 존재하면 제거
    const existing = document.getElementById('lifesim-quick-toolbar');
    if (existing) {
        existing.remove();
    }
    
    // 툴바 생성
    const toolbar = document.createElement('div');
    toolbar.id = 'lifesim-quick-toolbar';
    toolbar.className = 'lifesim-quick-toolbar';
    toolbar.innerHTML = `
        <div class="lifesim-toolbar-section">
            <button id="lifesim-quick-send" class="lifesim-toolbar-btn" title="퀵 센드 (Ctrl+Shift+Enter)">
                📨 퀵센드
            </button>
            
            <div class="lifesim-toolbar-dropdown">
                <button id="lifesim-time-divider-btn" class="lifesim-toolbar-btn" title="시간 구분선">
                    ⏱️ 구분선
                </button>
                <div id="lifesim-time-divider-menu" class="lifesim-dropdown-menu" style="display: none;">
                    <button data-time="30분 후">30분 후</button>
                    <button data-time="1시간 후">1시간 후</button>
                    <button data-time="3시간 후">3시간 후</button>
                    <button data-time="다음날">다음날</button>
                    <button data-time="1주일 후">1주일 후</button>
                    <button data-time="custom">직접 입력...</button>
                </div>
            </div>
            
            <button id="lifesim-read-receipt" class="lifesim-toolbar-btn" title="읽씹 연출">
                👻 읽씹
            </button>
            
            <button id="lifesim-unavailable" class="lifesim-toolbar-btn" title="연락 안 됨">
                📵 연락안됨
            </button>
            
            <div class="lifesim-toolbar-dropdown">
                <button id="lifesim-event-generator-btn" class="lifesim-toolbar-btn" title="사건 생성">
                    ⚡ 사건생성
                </button>
                <div id="lifesim-event-generator-menu" class="lifesim-dropdown-menu" style="display: none;">
                    <button data-category="일상">📰 일상</button>
                    <button data-category="직장/학교">💼 직장/학교</button>
                    <button data-category="관계">❤️ 관계</button>
                    <button data-category="사고">🌧️ 사고</button>
                    <button data-category="좋은일">🎉 좋은일</button>
                    <button data-category="긴급">⚡ 긴급</button>
                    <button data-category="랜덤">🎲 랜덤</button>
                </div>
            </div>
            
            <button id="lifesim-voice-memo" class="lifesim-toolbar-btn" title="음성메모">
                🎤 음성메모
            </button>
            
            <button id="lifesim-event-archive-btn" class="lifesim-toolbar-btn" title="사건 기록">
                📜 사건기록
            </button>
        </div>
    `;
    
    // 채팅 입력 영역 위에 삽입
    chatInput.parentNode.insertBefore(toolbar, chatInput);
    
    // 이벤트 리스너 등록
    attachToolbarListeners();
}

/**
 * 툴바 버튼 이벤트 리스너 등록
 */
function attachToolbarListeners() {
    // 퀵 센드
    document.getElementById('lifesim-quick-send')?.addEventListener('click', handleQuickSend);
    
    // 시간 구분선 드롭다운
    const timeDividerBtn = document.getElementById('lifesim-time-divider-btn');
    const timeDividerMenu = document.getElementById('lifesim-time-divider-menu');
    
    timeDividerBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown(timeDividerMenu);
    });
    
    timeDividerMenu?.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            const time = btn.dataset.time;
            handleTimeDivider(time);
            hideDropdown(timeDividerMenu);
        });
    });
    
    // 읽씹 연출
    document.getElementById('lifesim-read-receipt')?.addEventListener('click', handleReadReceipt);
    
    // 연락 안 됨
    document.getElementById('lifesim-unavailable')?.addEventListener('click', handleUnavailable);
    
    // 사건 생성 드롭다운
    const eventGeneratorBtn = document.getElementById('lifesim-event-generator-btn');
    const eventGeneratorMenu = document.getElementById('lifesim-event-generator-menu');
    
    eventGeneratorBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleDropdown(eventGeneratorMenu);
    });
    
    eventGeneratorMenu?.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.category;
            handleEventGeneration(category);
            hideDropdown(eventGeneratorMenu);
        });
    });
    
    // 음성메모
    document.getElementById('lifesim-voice-memo')?.addEventListener('click', handleVoiceMemo);
    
    // 사건 기록 아카이브
    document.getElementById('lifesim-event-archive-btn')?.addEventListener('click', showEventArchive);
    
    // 외부 클릭 시 드롭다운 닫기
    document.addEventListener('click', () => {
        document.querySelectorAll('.lifesim-dropdown-menu').forEach(menu => {
            hideDropdown(menu);
        });
    });
}

/**
 * 드롭다운 토글
 */
function toggleDropdown(menu) {
    const isVisible = menu.style.display === 'block';
    // 모든 드롭다운 숨기기
    document.querySelectorAll('.lifesim-dropdown-menu').forEach(m => {
        m.style.display = 'none';
    });
    // 현재 드롭다운 토글
    menu.style.display = isVisible ? 'none' : 'block';
}

/**
 * 드롭다운 숨기기
 */
function hideDropdown(menu) {
    if (menu) {
        menu.style.display = 'none';
    }
}

/**
 * 퀵 센드 처리
 * 입력창의 텍스트를 AI 응답 없이 전송
 */
async function handleQuickSend() {
    const textarea = document.getElementById('send_textarea');
    if (!textarea) return;
    
    const text = textarea.value.trim();
    if (!text) {
        showToast('전송할 내용이 없습니다.', 'warning');
        return;
    }
    
    await sendMessage(text);
    textarea.value = '';
    showToast('메시지 전송 완료', 'success');
}

/**
 * 시간 구분선 처리
 */
async function handleTimeDivider(timeText) {
    if (timeText === 'custom') {
        // 직접 입력
        showInputDialog('시간 경과 텍스트를 입력하세요', '1주일 후', async (input) => {
            if (input) {
                await insertDivider(input);
                showToast('구분선 삽입 완료', 'success');
            }
        });
    } else {
        await insertDivider(timeText);
        showToast('구분선 삽입 완료', 'success');
    }
}

/**
 * 읽씹 연출 처리
 */
async function handleReadReceipt() {
    // 현재 캐릭터 이름 가져오기
    const charName = getCurrentCharacterName();
    
    await executeReadReceiptScene(charName);
    showToast('읽씹 연출 실행 중...', 'info');
}

/**
 * 연락 안 됨 연출 처리
 */
async function handleUnavailable() {
    const charName = getCurrentCharacterName();
    
    await executeUnavailableScene(charName);
    showToast('연락 안 됨 연출 실행 중...', 'info');
}

/**
 * 사건 생성 처리
 */
async function handleEventGeneration(category) {
    const charName = getCurrentCharacterName();
    
    // AI가 사건 생성
    await generateEvent(charName, category);
    
    // 사건 기록 저장
    const event = {
        id: generateId(),
        category: category,
        date: new Date().toISOString(),
        description: '사건 생성됨 (AI가 생성한 내용은 채팅 확인)'
    };
    
    eventArchive.push(event);
    saveData('event_archive', eventArchive, 'chat');
    
    showToast(`${category} 사건 생성 중...`, 'info');
}

/**
 * 음성메모 처리
 */
async function handleVoiceMemo() {
    // 인라인 입력 다이얼로그 표시
    const dialogHtml = `
        <div style="margin: 20px 0;">
            <div style="margin-bottom: 15px;">
                <label class="lifesim-form-label">길이 (초):</label>
                <input type="number" id="voice-memo-duration" class="lifesim-input" value="23" min="1" max="300">
            </div>
            <div style="margin-bottom: 15px;">
                <label class="lifesim-form-label">내용 힌트 (선택):</label>
                <input type="text" id="voice-memo-hint" class="lifesim-input" placeholder="예: 오늘 늦겠다고">
            </div>
        </div>
    `;
    
    // 커스텀 다이얼로그 생성 (popup.js 활용)
    const { createPopup } = await import('../../utils/popup.js');
    
    createPopup({
        title: '🎤 음성메모',
        content: dialogHtml,
        width: '400px',
        buttons: [
            {
                text: '취소',
                className: ''
            },
            {
                text: '삽입',
                className: 'lifesim-btn-primary',
                onClick: async () => {
                    const duration = parseInt(document.getElementById('voice-memo-duration').value) || 23;
                    const hint = document.getElementById('voice-memo-hint').value.trim();
                    
                    // 음성메시지 마커 삽입
                    await insertVoiceMemo(duration);
                    
                    // 힌트가 있으면 AI 응답 생성
                    if (hint) {
                        const charName = getCurrentCharacterName();
                        await generateVoiceMemoResponse(charName, hint);
                    }
                    
                    showToast('음성메모 삽입 완료', 'success');
                }
            }
        ]
    });
}

/**
 * 사건 기록 아카이브 표시
 */
function showEventArchive() {
    const { createPopup } = require('../../utils/popup.js');
    
    let archiveHtml = '';
    
    if (eventArchive.length === 0) {
        archiveHtml = '<p style="text-align: center; color: #999; padding: 40px;">기록된 사건이 없습니다.</p>';
    } else {
        archiveHtml = '<div class="lifesim-event-archive-list">';
        
        eventArchive.reverse().forEach(event => {
            const date = new Date(event.date);
            const dateStr = `${date.getMonth() + 1}월 ${date.getDate()}일 ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
            
            archiveHtml += `
                <div class="lifesim-event-item">
                    <div class="lifesim-event-header">
                        <span class="lifesim-event-category">${event.category}</span>
                        <span class="lifesim-event-date">${dateStr}</span>
                    </div>
                    <div class="lifesim-event-description">${event.description}</div>
                </div>
            `;
        });
        
        archiveHtml += '</div>';
    }
    
    createPopup({
        title: '📜 사건 기록',
        content: archiveHtml,
        width: '600px',
        buttons: [
            {
                text: '닫기',
                className: 'lifesim-btn'
            }
        ]
    });
}

/**
 * 단축키 등록
 */
function registerShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl+Shift+Enter: 퀵 센드
        if (e.ctrlKey && e.shiftKey && e.key === 'Enter') {
            e.preventDefault();
            handleQuickSend();
        }
    });
}

/**
 * Quick Tools CSS 로드
 */
function loadQuickToolsCSS() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'scripts/extensions/st-lifesim/modules/quick-tools/quick-tools.css';
    document.head.appendChild(link);
}

/**
 * 현재 캐릭터 이름 가져오기
 */
function getCurrentCharacterName() {
    // SillyTavern API에서 캐릭터 이름 가져오기
    if (window.SillyTavern && window.SillyTavern.getContext) {
        const context = window.SillyTavern.getContext();
        return context.name || context.character_name || '{{char}}';
    }
    
    return '{{char}}';
}

/**
 * 고유 ID 생성
 */
function generateId() {
    return 'event_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}
