/* ============================================================================
 * call.js - 통화 & 통화기록 모듈
 * ============================================================================
 * 통화 감지 및 기록 시스템
 * - AI 응답에서 통화 키워드 감지
 * - 통화 시작/종료 마커 삽입
 * - 통화 기록 아카이브
 * - 컨텍스트 포함/제외 설정
 * ========================================================================== */

import { storage } from '../../utils/storage.js';
import { send } from '../../utils/slash.js';
import { createPopup, confirm } from '../../utils/popup.js';
import { showSuccess, showError, createElement, createTabs } from '../../utils/ui.js';
import { contextInjector, formatSection } from '../../utils/context-inject.js';

let callLogs = [];
let activeCall = null;
let callStartTime = null;
let callDetectionKeywords = ['전화할게', '전화 걸게', '전화해도', 'call', 'phone', '통화', '전화'];
let popupInstance = null;

/**
 * 모듈 초기화
 */
export async function init() {
    console.log('[Call] 모듈 초기화...');
    
    // CSS 로드
    loadCSS();
    
    // 데이터 로드
    loadCallLogs();
    loadSettings();
    
    // 툴바 버튼 추가
    addToolbarButton();
    
    // 컨텍스트 주입 등록
    contextInjector.register('call', generateContext);
    
    // AI 응답 감지 등록
    registerCallDetection();
    
    console.log('[Call] 모듈 초기화 완료');
}

/**
 * 모듈 정리
 */
export function cleanup() {
    contextInjector.unregister('call');
    
    const btn = document.querySelector('#stls-call-btn');
    if (btn) btn.remove();
    
    if (popupInstance) {
        popupInstance.close();
    }
    
    // 이벤트 리스너 제거
    if (window.eventSource) {
        window.eventSource.off('messageReceived', handleCallDetection);
    }
    
    // 활성 통화 바 제거
    removeActiveCallBar();
}

/**
 * CSS 로드
 */
function loadCSS() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = new URL('./call.css', import.meta.url).href;
    document.head.appendChild(link);
}

/**
 * 툴바 버튼 추가
 */
function addToolbarButton() {
    const toolbar = document.querySelector('#stls-quick-toolbar');
    if (!toolbar) {
        console.warn('[Call] 퀵 툴바를 찾을 수 없습니다.');
        return;
    }
    
    const btn = createElement('button', {
        id: 'stls-call-btn',
        className: 'stls-toolbar-btn',
        onClick: showCallLogsPopup
    }, '📞 통화기록');
    
    toolbar.appendChild(btn);
}

/**
 * 통화 감지 등록
 */
function registerCallDetection() {
    if (window.eventSource) {
        window.eventSource.on('messageReceived', handleCallDetection);
    }
}

/**
 * 통화 감지 핸들러
 */
function handleCallDetection(data) {
    // 활성 통화 중이면 무시
    if (activeCall) {
        return;
    }
    
    // 메시지 내용 확인
    const message = data?.message?.mes || '';
    
    // 키워드 감지
    const detected = callDetectionKeywords.some(keyword => 
        message.toLowerCase().includes(keyword.toLowerCase())
    );
    
    if (detected) {
        // 통화 시작 확인 알림 표시
        showCallStartNotification(data?.message?.name || 'Unknown');
    }
}

/**
 * 통화 시작 확인 알림
 */
function showCallStartNotification(contactName) {
    const notification = createElement('div', { className: 'stls-call-notification' });
    
    notification.innerHTML = `
        <div class="stls-call-notification-icon">📞</div>
        <div class="stls-call-notification-text">통화를 시작하시겠습니까?</div>
        <div class="stls-call-notification-text" style="font-size: 14px; color: #999;">
            상대방: ${contactName}
        </div>
    `;
    
    const actions = createElement('div', { className: 'stls-call-notification-actions' });
    
    const confirmBtn = createElement('button', {
        className: 'stls-btn stls-btn-primary',
        onClick: () => {
            startCall(contactName);
            notification.remove();
        }
    }, '확인');
    
    const ignoreBtn = createElement('button', {
        className: 'stls-btn stls-btn-secondary',
        onClick: () => {
            notification.remove();
        }
    }, '무시');
    
    actions.appendChild(confirmBtn);
    actions.appendChild(ignoreBtn);
    notification.appendChild(actions);
    
    document.body.appendChild(notification);
    
    // 10초 후 자동 제거
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.remove();
        }
    }, 10000);
}

/**
 * 통화 시작
 */
async function startCall(contactName) {
    activeCall = contactName;
    callStartTime = Date.now();
    
    // 통화 시작 마커 삽입
    await send(`📞 통화 시작 — ${contactName}`);
    
    // 활성 통화 바 표시
    showActiveCallBar(contactName);
    
    // 툴바에 통화 종료 버튼 추가
    addEndCallButton();
    
    showSuccess('통화가 시작되었습니다.');
}

/**
 * 활성 통화 바 표시
 */
function showActiveCallBar(contactName) {
    removeActiveCallBar();
    
    const bar = createElement('div', {
        className: 'stls-call-active-bar',
        id: 'stls-call-active-bar'
    });
    
    bar.innerHTML = `
        <div class="stls-call-active-icon">📞</div>
        <div class="stls-call-active-info">
            <div class="stls-call-active-name">${contactName}</div>
            <div class="stls-call-active-time" id="call-timer">00:00</div>
        </div>
    `;
    
    const endBtn = createElement('button', {
        className: 'stls-btn stls-btn-danger',
        onClick: endCall,
        style: { fontSize: '12px', padding: '4px 12px' }
    }, '종료');
    
    bar.appendChild(endBtn);
    document.body.appendChild(bar);
    
    // 타이머 시작
    startCallTimer();
}

/**
 * 활성 통화 바 제거
 */
function removeActiveCallBar() {
    const bar = document.getElementById('stls-call-active-bar');
    if (bar) {
        bar.remove();
    }
}

/**
 * 통화 타이머 시작
 */
function startCallTimer() {
    const timer = document.getElementById('call-timer');
    if (!timer) return;
    
    const interval = setInterval(() => {
        if (!activeCall || !callStartTime) {
            clearInterval(interval);
            return;
        }
        
        const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        
        if (timer) {
            timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }, 1000);
}

/**
 * 툴바에 통화 종료 버튼 추가
 */
function addEndCallButton() {
    const toolbar = document.querySelector('#stls-quick-toolbar');
    if (!toolbar) return;
    
    // 기존 버튼 제거
    const existing = document.getElementById('stls-end-call-btn');
    if (existing) {
        existing.remove();
    }
    
    const btn = createElement('button', {
        id: 'stls-end-call-btn',
        className: 'stls-toolbar-btn',
        style: { background: '#e74c3c', borderColor: '#c0392b' },
        onClick: endCall
    }, '📵 통화 종료');
    
    toolbar.appendChild(btn);
}

/**
 * 통화 종료
 */
async function endCall() {
    if (!activeCall || !callStartTime) {
        return;
    }
    
    const contactName = activeCall;
    const durationSeconds = Math.floor((Date.now() - callStartTime) / 1000);
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;
    
    // 통화 종료 마커 삽입
    await send(`📵 통화 종료 (통화시간: ${minutes}분 ${seconds}초)`);
    
    // 통화 기록 저장 여부 확인
    const shouldSave = await confirm('이 구간을 통화 기록으로 저장하시겠습니까?');
    
    if (shouldSave) {
        callLogs.push({
            id: Date.now().toString(),
            contactName,
            date: new Date().toISOString(),
            durationSeconds,
            messages: [], // 실제로는 통화 구간 메시지를 수집해야 함
            includeInContext: false
        });
        
        saveCallLogs();
        showSuccess('통화 기록이 저장되었습니다.');
    }
    
    // 상태 초기화
    activeCall = null;
    callStartTime = null;
    
    // UI 제거
    removeActiveCallBar();
    const endBtn = document.getElementById('stls-end-call-btn');
    if (endBtn) {
        endBtn.remove();
    }
}

/**
 * 통화기록 팝업 표시
 */
function showCallLogsPopup() {
    const tabs = [
        {
            id: 'logs',
            label: '통화기록',
            content: createLogsTab
        },
        {
            id: 'settings',
            label: '설정',
            content: createSettingsTab
        }
    ];
    
    const tabContainer = createTabs(tabs, 'logs');
    
    popupInstance = createPopup({
        title: '📞 통화기록',
        content: tabContainer,
        buttons: [
            {
                text: '닫기',
                className: 'stls-btn-secondary'
            }
        ],
        width: '750px',
        height: '700px',
        onClose: () => {
            popupInstance = null;
        }
    });
}

/**
 * 통화기록 탭
 */
function createLogsTab() {
    const container = createElement('div');
    
    const list = createElement('div', { className: 'stls-call-logs-list' });
    
    if (callLogs.length === 0) {
        list.innerHTML = `
            <div class="stls-call-empty">
                <div class="stls-call-empty-icon">📞</div>
                <p>저장된 통화기록이 없습니다.</p>
            </div>
        `;
    } else {
        // 최신순 정렬
        const sorted = [...callLogs].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );
        
        sorted.forEach(log => {
            const item = renderCallLog(log);
            list.appendChild(item);
        });
    }
    
    container.appendChild(list);
    
    return container;
}

/**
 * 통화기록 아이템 렌더링
 */
function renderCallLog(log) {
    const item = createElement('div', { className: 'stls-call-log-item' });
    
    const date = new Date(log.date);
    const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    
    const minutes = Math.floor(log.durationSeconds / 60);
    const seconds = log.durationSeconds % 60;
    const durationStr = `${minutes}분 ${seconds}초`;
    
    item.innerHTML = `
        <div class="stls-call-log-header">
            <div class="stls-call-log-contact">📞 ${log.contactName}</div>
            <div class="stls-call-log-date">${dateStr}</div>
        </div>
        <div class="stls-call-log-duration">${durationStr}</div>
    `;
    
    const actions = createElement('div', { className: 'stls-call-log-actions' });
    
    const contextBtn = createElement('button', {
        className: `stls-btn ${log.includeInContext ? 'stls-btn-primary' : 'stls-btn-secondary'}`,
        style: { fontSize: '12px', padding: '4px 12px' },
        onClick: () => {
            log.includeInContext = !log.includeInContext;
            saveCallLogs();
            showCallLogsPopup();
        }
    }, log.includeInContext ? '컨텍스트: ON ✅' : '컨텍스트: OFF');
    
    const deleteBtn = createElement('button', {
        className: 'stls-btn stls-btn-danger',
        style: { fontSize: '12px', padding: '4px 12px' },
        onClick: async () => {
            const confirmed = await confirm('이 통화 기록을 삭제하시겠습니까?');
            if (confirmed) {
                callLogs = callLogs.filter(l => l.id !== log.id);
                saveCallLogs();
                showCallLogsPopup();
            }
        }
    }, '삭제');
    
    actions.appendChild(contextBtn);
    actions.appendChild(deleteBtn);
    
    item.appendChild(actions);
    
    return item;
}

/**
 * 설정 탭
 */
function createSettingsTab() {
    const container = createElement('div', { style: { padding: '16px' } });
    
    container.innerHTML = `
        <div class="stls-form-group">
            <label class="stls-label">통화 감지 키워드 (쉼표로 구분)</label>
            <textarea class="stls-textarea" id="call-keywords" style="min-height: 120px;">${callDetectionKeywords.join(', ')}</textarea>
            <p class="stls-text-sm stls-text-muted" style="margin-top: 8px;">
                AI 응답에 이 키워드가 포함되면 통화 시작 알림이 표시됩니다.
            </p>
        </div>
        
        <button class="stls-btn stls-btn-primary" id="save-keywords-btn">저장</button>
    `;
    
    // 저장 버튼
    setTimeout(() => {
        const saveBtn = container.querySelector('#save-keywords-btn');
        saveBtn.addEventListener('click', () => {
            const textarea = container.querySelector('#call-keywords');
            const keywords = textarea.value.split(',').map(k => k.trim()).filter(Boolean);
            
            if (keywords.length === 0) {
                showError('최소 1개 이상의 키워드를 입력해주세요.');
                return;
            }
            
            callDetectionKeywords = keywords;
            saveSettings();
            showSuccess('설정을 저장했습니다.');
        });
    }, 100);
    
    return container;
}

/**
 * 통화기록 로드
 */
function loadCallLogs() {
    callLogs = storage.getData('call', 'logs', [], 'chat');
}

/**
 * 통화기록 저장
 */
function saveCallLogs() {
    storage.setData('call', 'logs', callLogs, 'chat');
}

/**
 * 설정 로드
 */
function loadSettings() {
    const saved = storage.getData('call', 'keywords', null, 'global');
    if (saved) {
        callDetectionKeywords = saved;
    }
}

/**
 * 설정 저장
 */
function saveSettings() {
    storage.setData('call', 'keywords', callDetectionKeywords, 'global');
}

/**
 * 컨텍스트 생성
 */
function generateContext() {
    const includedLogs = callLogs
        .filter(l => l.includeInContext)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3);
    
    if (includedLogs.length === 0) {
        return '';
    }
    
    const items = includedLogs.map(l => {
        const date = new Date(l.date);
        const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
        const minutes = Math.floor(l.durationSeconds / 60);
        return `${l.contactName}와의 통화 (${minutes}분, ${dateStr})`;
    });
    
    return formatSection('최근 통화기록', items);
}

export default {
    init,
    cleanup
};
