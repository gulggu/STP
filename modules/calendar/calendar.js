/* ============================================================================
 * calendar.js - 캘린더 모듈
 * ============================================================================
 * 1~30일 순환 캘린더 시스템
 * - 현실 날짜 사용 X
 * - 유저가 수동으로 오늘 설정
 * - 일정 추가/편집/삭제
 * - 연락처 연동
 * ========================================================================== */

import { storage } from '../../utils/storage.js';
import { createPopup, confirm } from '../../utils/popup.js';
import { showSuccess, showError, createElement } from '../../utils/ui.js';
import { contextInjector, formatSection } from '../../utils/context-inject.js';

let calendarData = {
    today: 1,
    events: []
};
let popupInstance = null;

/**
 * 모듈 초기화
 */
export async function init() {
    console.log('[Calendar] 모듈 초기화...');
    
    // CSS 로드
    loadCSS();
    
    // 데이터 로드
    loadCalendar();
    
    // 툴바 버튼 추가
    addToolbarButton();
    
    // 컨텍스트 주입 등록
    contextInjector.register('calendar', generateContext);
    
    console.log('[Calendar] 모듈 초기화 완료');
}

/**
 * 모듈 정리
 */
export function cleanup() {
    contextInjector.unregister('calendar');
    
    const btn = document.querySelector('#stls-calendar-btn');
    if (btn) btn.remove();
    
    if (popupInstance) {
        popupInstance.close();
    }
}

/**
 * CSS 로드
 */
function loadCSS() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = new URL('./calendar.css', import.meta.url).href;
    document.head.appendChild(link);
}

/**
 * 툴바 버튼 추가
 */
function addToolbarButton() {
    const toolbar = document.querySelector('#stls-quick-toolbar');
    if (!toolbar) {
        console.warn('[Calendar] 퀵 툴바를 찾을 수 없습니다.');
        return;
    }
    
    const btn = createElement('button', {
        id: 'stls-calendar-btn',
        className: 'stls-toolbar-btn',
        onClick: showCalendarPopup
    }, '📅 캘린더');
    
    toolbar.appendChild(btn);
}

/**
 * 캘린더 팝업 표시
 */
function showCalendarPopup() {
    function renderContent() {
        const container = createElement('div');
        
        // 컨트롤
        const controls = createElement('div', { className: 'stls-calendar-controls' });
        
        const prevBtn = createElement('button', {
            className: 'stls-calendar-nav-btn',
            onClick: () => {
                calendarData.today = calendarData.today === 1 ? 30 : calendarData.today - 1;
                saveCalendar();
                updateContent();
            }
        }, '◀');
        
        const todayDisplay = createElement('div', {
            className: 'stls-calendar-today',
            id: 'calendar-today'
        }, `오늘: ${calendarData.today}일`);
        
        const nextBtn = createElement('button', {
            className: 'stls-calendar-nav-btn',
            onClick: () => {
                calendarData.today = calendarData.today === 30 ? 1 : calendarData.today + 1;
                saveCalendar();
                updateContent();
            }
        }, '▶');
        
        controls.appendChild(prevBtn);
        controls.appendChild(todayDisplay);
        controls.appendChild(nextBtn);
        
        // 캘린더 그리드
        const grid = createElement('div', {
            className: 'stls-calendar-grid',
            id: 'calendar-grid'
        });
        
        // 요일 헤더
        const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
        weekdays.forEach(day => {
            const weekday = createElement('div', { className: 'stls-calendar-weekday' }, day);
            grid.appendChild(weekday);
        });
        
        // 일자 렌더링 (1~30일 + 이전/다음 달 일부)
        for (let i = 1; i <= 35; i++) {
            const day = ((i - 1) % 30) + 1;
            const isToday = day === calendarData.today;
            const hasEvents = calendarData.events.some(e => e.day === day && !e.done);
            
            const dayEl = createElement('div', {
                className: `stls-calendar-day ${isToday ? 'today' : ''} ${hasEvents ? 'has-events' : ''}`,
                onClick: () => showDayEvents(day)
            });
            
            dayEl.innerHTML = `<div class="stls-calendar-day-num">${day}</div>`;
            
            grid.appendChild(dayEl);
        }
        
        // 일정 목록
        const eventsSection = createElement('div', { className: 'stls-calendar-events', id: 'calendar-events' });
        
        container.appendChild(controls);
        container.appendChild(grid);
        container.appendChild(eventsSection);
        
        updateEventsList();
        
        return container;
    }
    
    function updateContent() {
        const todayDisplay = document.getElementById('calendar-today');
        if (todayDisplay) {
            todayDisplay.textContent = `오늘: ${calendarData.today}일`;
        }
        
        // 그리드 재생성
        const grid = document.getElementById('calendar-grid');
        if (grid) {
            // 요일 헤더 제거하고 재생성
            grid.innerHTML = '';
            
            const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
            weekdays.forEach(day => {
                const weekday = createElement('div', { className: 'stls-calendar-weekday' }, day);
                grid.appendChild(weekday);
            });
            
            for (let i = 1; i <= 35; i++) {
                const day = ((i - 1) % 30) + 1;
                const isToday = day === calendarData.today;
                const hasEvents = calendarData.events.some(e => e.day === day && !e.done);
                
                const dayEl = createElement('div', {
                    className: `stls-calendar-day ${isToday ? 'today' : ''} ${hasEvents ? 'has-events' : ''}`,
                    onClick: () => showDayEvents(day)
                });
                
                dayEl.innerHTML = `<div class="stls-calendar-day-num">${day}</div>`;
                
                grid.appendChild(dayEl);
            }
        }
        
        updateEventsList();
    }
    
    function updateEventsList() {
        const eventsSection = document.getElementById('calendar-events');
        if (!eventsSection) return;
        
        eventsSection.innerHTML = '';
        
        // 오늘과 가까운 일정 표시
        const upcomingEvents = calendarData.events
            .filter(e => !e.done)
            .sort((a, b) => {
                const diffA = (a.day - calendarData.today + 30) % 30;
                const diffB = (b.day - calendarData.today + 30) % 30;
                return diffA - diffB;
            })
            .slice(0, 5);
        
        if (upcomingEvents.length === 0) {
            eventsSection.innerHTML = '<div class="stls-calendar-empty">예정된 일정이 없습니다.</div>';
            return;
        }
        
        const title = createElement('h4', { style: { marginBottom: '12px' } }, '다가오는 일정');
        eventsSection.appendChild(title);
        
        upcomingEvents.forEach(event => {
            const item = renderEventItem(event);
            eventsSection.appendChild(item);
        });
    }
    
    popupInstance = createPopup({
        title: '📅 캘린더',
        content: renderContent(),
        buttons: [
            {
                text: '+ 일정 추가',
                className: 'stls-btn-primary',
                onClick: () => showEventForm(),
                closeOnClick: false
            },
            {
                text: '닫기',
                className: 'stls-btn-secondary'
            }
        ],
        width: '700px',
        height: '750px',
        onClose: () => {
            popupInstance = null;
        }
    });
}

/**
 * 특정 날짜의 일정 표시
 */
function showDayEvents(day) {
    const dayEvents = calendarData.events.filter(e => e.day === day);
    
    if (dayEvents.length === 0) {
        showEventForm(null, day);
        return;
    }
    
    const content = createElement('div');
    
    const title = createElement('h4', { style: { marginBottom: '16px' } }, `${day}일 일정`);
    content.appendChild(title);
    
    dayEvents.forEach(event => {
        const item = renderEventItem(event);
        content.appendChild(item);
    });
    
    const popup = createPopup({
        title: `📅 ${day}일`,
        content,
        buttons: [
            {
                text: '+ 일정 추가',
                className: 'stls-btn-primary',
                onClick: () => {
                    popup.close();
                    showEventForm(null, day);
                }
            },
            {
                text: '닫기',
                className: 'stls-btn-secondary'
            }
        ],
        width: '500px'
    });
}

/**
 * 일정 아이템 렌더링
 */
function renderEventItem(event) {
    const item = createElement('div', {
        className: `stls-calendar-event-item ${event.done ? 'done' : ''}`
    });
    
    const daysUntil = (event.day - calendarData.today + 30) % 30;
    const daysText = daysUntil === 0 ? '오늘' : `D+${daysUntil}`;
    
    item.innerHTML = `
        <div class="stls-calendar-event-header">
            <div class="stls-calendar-event-title">${event.title}</div>
            <div class="stls-calendar-event-time">${event.time || ''}</div>
        </div>
        ${event.description ? `<div class="stls-calendar-event-desc">${event.description}</div>` : ''}
        <div class="stls-calendar-event-meta">
            ${event.day}일 (${daysText})
            ${event.relatedContactId ? ` • 관련: ${event.relatedContactId}` : ''}
        </div>
    `;
    
    const actions = createElement('div', { className: 'stls-calendar-event-actions' });
    
    const doneBtn = createElement('button', {
        className: 'stls-btn stls-btn-secondary',
        style: { fontSize: '12px', padding: '4px 8px' },
        onClick: () => {
            event.done = !event.done;
            saveCalendar();
            showCalendarPopup();
        }
    }, event.done ? '✓ 완료됨' : '완료 표시');
    
    const editBtn = createElement('button', {
        className: 'stls-btn stls-btn-secondary',
        style: { fontSize: '12px', padding: '4px 8px' },
        onClick: () => showEventForm(event.id)
    }, '편집');
    
    const deleteBtn = createElement('button', {
        className: 'stls-btn stls-btn-danger',
        style: { fontSize: '12px', padding: '4px 8px' },
        onClick: async () => {
            const confirmed = await confirm(`"${event.title}" 일정을 삭제하시겠습니까?`);
            if (confirmed) {
                deleteEvent(event.id);
                showCalendarPopup();
            }
        }
    }, '삭제');
    
    actions.appendChild(doneBtn);
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    
    item.appendChild(actions);
    
    return item;
}

/**
 * 일정 추가/편집 폼
 */
function showEventForm(editId = null, defaultDay = null) {
    const editing = editId ? calendarData.events.find(e => e.id === editId) : null;
    
    const form = createElement('div', { className: 'stls-calendar-form' });
    
    form.innerHTML = `
        <div class="stls-form-group">
            <label class="stls-label">날짜 *</label>
            <input type="number" class="stls-input" id="event-day" value="${editing?.day || defaultDay || calendarData.today}" min="1" max="30" />
        </div>
        
        <div class="stls-form-group">
            <label class="stls-label">시간</label>
            <input type="time" class="stls-input" id="event-time" value="${editing?.time || ''}" />
        </div>
        
        <div class="stls-form-group">
            <label class="stls-label">제목 *</label>
            <input type="text" class="stls-input" id="event-title" value="${editing?.title || ''}" placeholder="예: 홍길동과 점심" />
        </div>
        
        <div class="stls-form-group">
            <label class="stls-label">내용</label>
            <textarea class="stls-textarea" id="event-desc" placeholder="예: 강남역 2번 출구">${editing?.description || ''}</textarea>
        </div>
        
        <div class="stls-form-group">
            <label class="stls-label">관련 인물</label>
            <input type="text" class="stls-input" id="event-contact" value="${editing?.relatedContactId || ''}" placeholder="연락처에서 선택 또는 직접 입력" />
        </div>
    `;
    
    const popup = createPopup({
        title: editing ? '일정 편집' : '일정 추가',
        content: form,
        buttons: [
            {
                text: '취소',
                className: 'stls-btn-secondary'
            },
            {
                text: '저장',
                className: 'stls-btn-primary',
                onClick: () => {
                    const day = parseInt(form.querySelector('#event-day').value);
                    const time = form.querySelector('#event-time').value;
                    const title = form.querySelector('#event-title').value.trim();
                    const description = form.querySelector('#event-desc').value.trim();
                    const relatedContactId = form.querySelector('#event-contact').value.trim();
                    
                    if (!title) {
                        showError('제목은 필수입니다.');
                        return;
                    }
                    
                    if (day < 1 || day > 30) {
                        showError('날짜는 1~30일 사이여야 합니다.');
                        return;
                    }
                    
                    if (editing) {
                        // 수정
                        Object.assign(editing, {
                            day,
                            time,
                            title,
                            description,
                            relatedContactId
                        });
                    } else {
                        // 추가
                        calendarData.events.push({
                            id: Date.now().toString(),
                            day,
                            time,
                            title,
                            description,
                            relatedContactId,
                            done: false
                        });
                    }
                    
                    saveCalendar();
                    showSuccess(editing ? '일정을 수정했습니다.' : '일정을 추가했습니다.');
                    
                    // 메인 팝업 업데이트
                    if (popupInstance) {
                        showCalendarPopup();
                    }
                }
            }
        ],
        width: '500px'
    });
}

/**
 * 일정 삭제
 */
function deleteEvent(id) {
    calendarData.events = calendarData.events.filter(e => e.id !== id);
    saveCalendar();
    showSuccess('일정을 삭제했습니다.');
}

/**
 * 캘린더 데이터 로드
 */
function loadCalendar() {
    const saved = storage.getData('calendar', 'data', null, 'chat');
    if (saved) {
        calendarData = saved;
    }
}

/**
 * 캘린더 데이터 저장
 */
function saveCalendar() {
    storage.setData('calendar', 'data', calendarData, 'chat');
}

/**
 * 컨텍스트 생성
 */
function generateContext() {
    const upcomingEvents = calendarData.events
        .filter(e => !e.done)
        .sort((a, b) => {
            const diffA = (a.day - calendarData.today + 30) % 30;
            const diffB = (b.day - calendarData.today + 30) % 30;
            return diffA - diffB;
        })
        .slice(0, 5);
    
    if (upcomingEvents.length === 0) {
        return '';
    }
    
    const items = upcomingEvents.map(e => {
        const daysUntil = (e.day - calendarData.today + 30) % 30;
        const daysText = daysUntil === 0 ? '오늘' : `D+${daysUntil}`;
        
        let line = `${daysText}(${e.day}일)`;
        if (e.time) line += ` ${e.time}`;
        line += `: ${e.title}`;
        if (e.description) line += ` (${e.description})`;
        
        return line;
    });
    
    return formatSection('일정', items);
}

/**
 * 캘린더 팝업 표시 (외부에서 호출 가능)
 */
export function showCalendarPanel() {
    showCalendarPopup();
}

export default {
    init,
    cleanup,
    showCalendarPanel
};
