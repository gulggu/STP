/* ===========================================
   calendar.js - 캘린더 모듈 (1~30일 순환)
   =========================================== */

(function() {
    'use strict';
    
    // 캘린더 데이터
    let calendar = {
        today: 1,
        events: []
    };
    
    /**
     * 초기화
     */
    function initialize() {
        console.log('[ST-LifeSim] Calendar 모듈 로딩...');
        
        // 저장된 캘린더 불러오기
        loadCalendar();
        
        // 툴바에 버튼 추가
        addToolbarButton();
        
        console.log('[ST-LifeSim] Calendar 모듈 로드 완료');
    }
    
    /**
     * 캘린더 불러오기
     */
    function loadCalendar() {
        const storage = window.STLifeSimStorage;
        if (storage) {
            const saved = storage.loadData('calendar', null, storage.STORAGE_TYPE.CHAT);
            if (saved) {
                calendar = saved;
            }
        }
    }
    
    /**
     * 캘린더 저장
     */
    function saveCalendar() {
        const storage = window.STLifeSimStorage;
        if (storage) {
            storage.saveData('calendar', calendar, storage.STORAGE_TYPE.CHAT);
        }
    }
    
    /**
     * 툴바에 버튼 추가
     */
    function addToolbarButton() {
        const toolbar = document.querySelector('#stls-quick-toolbar');
        if (!toolbar) {
            console.warn('[ST-LifeSim] Quick Tools 툴바를 찾을 수 없습니다.');
            return;
        }
        
        const btn = document.createElement('button');
        btn.className = 'stls-toolbar-btn';
        btn.textContent = '📅 캘린더';
        btn.addEventListener('click', showCalendarPanel);
        toolbar.appendChild(btn);
    }
    
    /**
     * 캘린더 패널 표시
     */
    function showCalendarPanel() {
        const content = createCalendarPanel();
        
        window.STLifeSimPopup?.createPopup?.({
            title: '📅 캘린더',
            content: content,
            width: '700px',
            height: '700px'
        });
    }
    
    /**
     * 캘린더 패널 생성
     */
    function createCalendarPanel() {
        const container = document.createElement('div');
        
        // 헤더 (오늘 날짜 표시 및 네비게이션)
        const header = document.createElement('div');
        header.className = 'stls-calendar-header';
        
        const prevBtn = document.createElement('button');
        prevBtn.className = 'stls-calendar-nav-btn';
        prevBtn.textContent = '◀';
        prevBtn.addEventListener('click', () => {
            calendar.today = calendar.today > 1 ? calendar.today - 1 : 30;
            saveCalendar();
            showCalendarPanel(); // 패널 새로고침
        });
        
        const todayLabel = document.createElement('div');
        todayLabel.className = 'stls-calendar-today';
        todayLabel.textContent = `오늘: ${calendar.today}일`;
        
        const nextBtn = document.createElement('button');
        nextBtn.className = 'stls-calendar-nav-btn';
        nextBtn.textContent = '▶';
        nextBtn.addEventListener('click', () => {
            calendar.today = calendar.today < 30 ? calendar.today + 1 : 1;
            saveCalendar();
            showCalendarPanel(); // 패널 새로고침
        });
        
        header.appendChild(prevBtn);
        header.appendChild(todayLabel);
        header.appendChild(nextBtn);
        container.appendChild(header);
        
        // 캘린더 그리드
        const grid = document.createElement('div');
        grid.className = 'stls-calendar-grid';
        
        // 요일 헤더
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        days.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'stls-calendar-day-header';
            dayHeader.textContent = day;
            grid.appendChild(dayHeader);
        });
        
        // 날짜 셀 (1~30일)
        for (let i = 1; i <= 30; i++) {
            const dayCell = createDayCell(i);
            grid.appendChild(dayCell);
        }
        
        // 남은 빈 셀 채우기 (7의 배수로 맞추기)
        const remainingCells = (7 - (30 % 7)) % 7;
        for (let i = 0; i < remainingCells; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.style.visibility = 'hidden';
            grid.appendChild(emptyCell);
        }
        
        container.appendChild(grid);
        
        // 일정 추가 버튼
        const addBtn = document.createElement('button');
        addBtn.className = 'stls-btn stls-btn-primary';
        addBtn.textContent = '+ 일정 추가';
        addBtn.style.cssText = 'width: 100%; margin-bottom: 20px;';
        addBtn.addEventListener('click', () => showEventDialog(null));
        container.appendChild(addBtn);
        
        // 오늘의 일정 목록
        const eventsSection = document.createElement('div');
        eventsSection.innerHTML = '<div class="stls-wallet-section-title">일정 목록</div>';
        
        const eventsList = document.createElement('div');
        eventsList.className = 'stls-calendar-events';
        
        const allEvents = calendar.events.sort((a, b) => a.day - b.day);
        
        if (allEvents.length === 0) {
            eventsList.innerHTML = '<p style="text-align: center; padding: 20px; color: #888;">등록된 일정이 없습니다.</p>';
        } else {
            allEvents.forEach(event => {
                const eventItem = createEventItem(event);
                eventsList.appendChild(eventItem);
            });
        }
        
        eventsSection.appendChild(eventsList);
        container.appendChild(eventsSection);
        
        return container;
    }
    
    /**
     * 날짜 셀 생성
     */
    function createDayCell(day) {
        const cell = document.createElement('div');
        cell.className = 'stls-calendar-day';
        cell.textContent = day;
        
        if (day === calendar.today) {
            cell.classList.add('today');
        }
        
        // 해당 날짜에 일정이 있는지 확인
        const hasEvent = calendar.events.some(e => e.day === day);
        if (hasEvent) {
            cell.classList.add('has-event');
        }
        
        // 클릭 시 해당 날짜로 이동
        cell.addEventListener('click', () => {
            calendar.today = day;
            saveCalendar();
            showCalendarPanel(); // 패널 새로고침
        });
        
        return cell;
    }
    
    /**
     * 일정 아이템 생성
     */
    function createEventItem(event) {
        const item = document.createElement('div');
        item.className = 'stls-calendar-event-item';
        if (event.done) {
            item.classList.add('stls-calendar-event-done');
        }
        
        const dayDiff = event.day - calendar.today;
        let dayLabel = `${event.day}일`;
        if (dayDiff === 0) {
            dayLabel += ' (오늘)';
        } else if (dayDiff > 0) {
            dayLabel += ` (D+${dayDiff})`;
        } else {
            dayLabel += ` (D${dayDiff})`;
        }
        
        const header = document.createElement('div');
        header.className = 'stls-calendar-event-header';
        
        const titleTime = document.createElement('div');
        titleTime.innerHTML = `
            <div class="stls-calendar-event-title">${event.title}</div>
            <div class="stls-calendar-event-time">${dayLabel}${event.time ? ` ${event.time}` : ''}</div>
        `;
        
        header.appendChild(titleTime);
        item.appendChild(header);
        
        if (event.description) {
            const desc = document.createElement('div');
            desc.className = 'stls-calendar-event-desc';
            desc.textContent = event.description;
            item.appendChild(desc);
        }
        
        // 관련 인물 표시
        if (event.relatedContactId) {
            const contacts = window.STLifeSimContacts?.getContacts?.() || [];
            const contact = contacts.find(c => c.id === event.relatedContactId);
            if (contact) {
                const contactTag = document.createElement('div');
                contactTag.style.cssText = 'margin-top: 6px; font-size: 12px; color: var(--SmartThemeQuoteColor, #4a9eff);';
                contactTag.textContent = `👤 ${contact.name}`;
                item.appendChild(contactTag);
            }
        }
        
        // 액션 버튼
        const actions = document.createElement('div');
        actions.className = 'stls-calendar-event-actions';
        
        const doneBtn = document.createElement('button');
        doneBtn.className = 'stls-btn';
        doneBtn.style.cssText = 'padding: 4px 8px; font-size: 12px;';
        doneBtn.textContent = event.done ? '완료 취소' : '완료';
        doneBtn.addEventListener('click', () => {
            event.done = !event.done;
            saveCalendar();
            showCalendarPanel(); // 패널 새로고침
        });
        
        const editBtn = document.createElement('button');
        editBtn.className = 'stls-btn';
        editBtn.style.cssText = 'padding: 4px 8px; font-size: 12px;';
        editBtn.textContent = '편집';
        editBtn.addEventListener('click', () => showEventDialog(event));
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'stls-btn';
        deleteBtn.style.cssText = 'padding: 4px 8px; font-size: 12px;';
        deleteBtn.textContent = '삭제';
        deleteBtn.addEventListener('click', () => {
            window.STLifeSimPopup?.showConfirm?.(
                `"${event.title}" 일정을 삭제하시겠습니까?`,
                () => {
                    calendar.events = calendar.events.filter(e => e.id !== event.id);
                    saveCalendar();
                    showCalendarPanel(); // 패널 새로고침
                    window.STLifeSimUI?.showSuccess?.('일정을 삭제했습니다.');
                }
            );
        });
        
        actions.appendChild(doneBtn);
        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);
        item.appendChild(actions);
        
        return item;
    }
    
    /**
     * 일정 추가/편집 다이얼로그
     */
    function showEventDialog(event = null) {
        const isEdit = event !== null;
        
        const content = document.createElement('div');
        
        // 연락처 옵션 생성
        const contacts = window.STLifeSimContacts?.getContacts?.() || [];
        let contactOptions = '<option value="">없음</option>';
        contacts.forEach(contact => {
            const selected = event?.relatedContactId === contact.id ? 'selected' : '';
            contactOptions += `<option value="${contact.id}" ${selected}>${contact.name}</option>`;
        });
        
        content.innerHTML = `
            <div class="stls-form-group">
                <label class="stls-form-label">날짜 (1~30일) *</label>
                <input type="number" class="stls-input" id="stls-event-day" value="${event?.day || calendar.today}" min="1" max="30" required>
            </div>
            <div class="stls-form-group">
                <label class="stls-form-label">시간 (선택사항)</label>
                <input type="time" class="stls-input" id="stls-event-time" value="${event?.time || ''}">
            </div>
            <div class="stls-form-group">
                <label class="stls-form-label">제목 *</label>
                <input type="text" class="stls-input" id="stls-event-title" value="${event?.title || ''}" required>
            </div>
            <div class="stls-form-group">
                <label class="stls-form-label">내용</label>
                <textarea class="stls-textarea" id="stls-event-desc">${event?.description || ''}</textarea>
            </div>
            <div class="stls-form-group">
                <label class="stls-form-label">관련 인물</label>
                <select class="stls-select" id="stls-event-contact">
                    ${contactOptions}
                </select>
            </div>
        `;
        
        window.STLifeSimPopup?.createPopup?.({
            title: isEdit ? '일정 편집' : '일정 추가',
            content: content,
            buttons: [
                { text: '취소' },
                {
                    text: '저장',
                    primary: true,
                    onClick: () => {
                        const day = parseInt(content.querySelector('#stls-event-day').value);
                        const time = content.querySelector('#stls-event-time').value;
                        const title = content.querySelector('#stls-event-title').value.trim();
                        const description = content.querySelector('#stls-event-desc').value.trim();
                        const relatedContactId = content.querySelector('#stls-event-contact').value;
                        
                        if (!title || !day || day < 1 || day > 30) {
                            window.STLifeSimUI?.showError?.('필수 항목을 올바르게 입력해주세요.');
                            return;
                        }
                        
                        if (isEdit) {
                            // 편집
                            event.day = day;
                            event.time = time;
                            event.title = title;
                            event.description = description;
                            event.relatedContactId = relatedContactId || null;
                        } else {
                            // 추가
                            calendar.events.push({
                                id: Date.now().toString(),
                                day,
                                time,
                                title,
                                description,
                                relatedContactId: relatedContactId || null,
                                done: false
                            });
                        }
                        
                        saveCalendar();
                        window.STLifeSimUI?.showSuccess?.(isEdit ? '일정을 수정했습니다.' : '일정을 추가했습니다.');
                        showCalendarPanel(); // 패널 새로고침
                    }
                }
            ]
        });
    }
    
    /**
     * 컨텍스트 생성
     */
    function getContext() {
        const todayEvents = calendar.events.filter(e => e.day === calendar.today && !e.done);
        const upcomingEvents = calendar.events.filter(e => e.day > calendar.today && e.day <= calendar.today + 7 && !e.done);
        
        if (todayEvents.length === 0 && upcomingEvents.length === 0) {
            return null;
        }
        
        let context = '=== 일정 ===\n';
        
        if (todayEvents.length > 0) {
            context += `오늘(${calendar.today}일):\n`;
            todayEvents.forEach(event => {
                context += `• ${event.title}`;
                if (event.time) {
                    context += ` (${event.time})`;
                }
                if (event.description) {
                    context += ` - ${event.description}`;
                }
                context += '\n';
            });
        }
        
        if (upcomingEvents.length > 0) {
            upcomingEvents.sort((a, b) => a.day - b.day).forEach(event => {
                const dayDiff = event.day - calendar.today;
                context += `D+${dayDiff}(${event.day}일): ${event.title}\n`;
            });
        }
        
        return context;
    }
    
    // 외부로 내보내기
    window.STLifeSimCalendar = {
        initialize,
        getContext
    };
    
    // 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();
