/* ===========================================
   call.js - 통화 & 통화기록 모듈
   =========================================== */

(function() {
    'use strict';
    
    // 통화 데이터
    let callLogs = [];
    let activeCall = null;
    let callStartTime = null;
    let callTimerInterval = null;
    
    // 통화 감지 키워드
    let callKeywords = ['전화할게', '전화 걸게', '전화해도', '전화하자', 'call', 'phone', '통화', '전화'];
    
    /**
     * 초기화
     */
    function initialize() {
        console.log('[ST-LifeSim] Call 모듈 로딩...');
        
        // 저장된 통화기록 불러오기
        loadCallLogs();
        
        // 툴바에 버튼 추가
        addToolbarButton();
        
        // 메시지 감지 이벤트 등록
        registerCallDetection();
        
        console.log('[ST-LifeSim] Call 모듈 로드 완료');
    }
    
    /**
     * 통화기록 불러오기
     */
    function loadCallLogs() {
        const storage = window.STLifeSimStorage;
        if (storage) {
            callLogs = storage.loadData('callLogs', [], storage.STORAGE_TYPE.CHAT);
        }
    }
    
    /**
     * 통화기록 저장
     */
    function saveCallLogs() {
        const storage = window.STLifeSimStorage;
        if (storage) {
            storage.saveData('callLogs', callLogs, storage.STORAGE_TYPE.CHAT);
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
        btn.textContent = '📞 통화기록';
        btn.addEventListener('click', showCallLogsPanel);
        toolbar.appendChild(btn);
        
        // 부재중 전화 버튼
        const missedBtn = document.createElement('button');
        missedBtn.className = 'stls-toolbar-btn';
        missedBtn.textContent = '📵 부재중';
        missedBtn.addEventListener('click', showMissedCallDialog);
        toolbar.appendChild(missedBtn);
    }
    
    /**
     * 통화 감지 이벤트 등록
     */
    function registerCallDetection() {
        if (window.eventSource) {
            window.eventSource.on('MESSAGE_RECEIVED', (data) => {
                // AI 응답 메시지 확인
                if (data && data.mes) {
                    checkForCallKeywords(data.mes);
                }
            });
            console.log('[ST-LifeSim] 통화 감지 이벤트 등록 완료');
        }
    }
    
    /**
     * 통화 키워드 감지
     */
    function checkForCallKeywords(message) {
        const lowerMessage = message.toLowerCase();
        const hasKeyword = callKeywords.some(keyword => lowerMessage.includes(keyword.toLowerCase()));
        
        if (hasKeyword && !activeCall) {
            showCallNotification();
        }
    }
    
    /**
     * 통화 알림 표시
     */
    function showCallNotification() {
        const charName = window.STLifeSimSlash?.getCurrentCharacterName?.() || '{{char}}';
        
        const notification = document.createElement('div');
        notification.className = 'stls-call-notification';
        notification.innerHTML = `
            <div class="stls-call-notification-title">📞 통화를 시작하시겠습니까?</div>
            <p style="margin: 8px 0; color: var(--SmartThemeEmColor, #aaa); font-size: 13px;">
                ${charName}와(과) 통화를 시작합니다.
            </p>
            <div class="stls-call-notification-actions">
                <button class="stls-btn stls-btn-primary" style="flex: 1;" id="stls-call-confirm">확인</button>
                <button class="stls-btn" style="flex: 1;" id="stls-call-ignore">무시</button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // 확인 버튼
        notification.querySelector('#stls-call-confirm').addEventListener('click', async () => {
            await startCall(charName);
            notification.remove();
        });
        
        // 무시 버튼
        notification.querySelector('#stls-call-ignore').addEventListener('click', () => {
            notification.remove();
        });
        
        // 10초 후 자동 제거
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 10000);
    }
    
    /**
     * 통화 시작
     */
    async function startCall(contactName) {
        activeCall = {
            contactName: contactName,
            startMessageIndex: null // 추후 메시지 저장 시 사용
        };
        
        callStartTime = Date.now();
        
        // 통화 시작 메시지 전송
        await window.STLifeSimSlash?.sendMessage?.(`📞 통화 시작 — ${contactName}`);
        
        // 통화 중 UI 표시
        showActiveCallUI();
        
        // 타이머 시작
        startCallTimer();
        
        window.STLifeSimUI?.showSuccess?.('통화가 시작되었습니다.');
    }
    
    /**
     * 통화 중 UI 표시
     */
    function showActiveCallUI() {
        const toolbar = document.createElement('div');
        toolbar.className = 'stls-call-toolbar-active';
        toolbar.id = 'stls-active-call-toolbar';
        toolbar.innerHTML = `
            <div style="flex: 1;">
                <div style="font-size: 12px; opacity: 0.9;">통화 중...</div>
                <div class="stls-call-toolbar-time" id="stls-call-timer">00:00</div>
            </div>
            <button class="stls-call-toolbar-end-btn" id="stls-end-call-btn">📵 통화 종료</button>
        `;
        
        document.body.appendChild(toolbar);
        
        // 종료 버튼 이벤트
        toolbar.querySelector('#stls-end-call-btn').addEventListener('click', () => {
            endCall();
        });
    }
    
    /**
     * 통화 타이머 시작
     */
    function startCallTimer() {
        callTimerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            
            const timerEl = document.getElementById('stls-call-timer');
            if (timerEl) {
                timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }
    
    /**
     * 통화 종료
     */
    async function endCall() {
        if (!activeCall) return;
        
        const duration = Math.floor((Date.now() - callStartTime) / 1000);
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;
        
        // 통화 종료 메시지 전송
        await window.STLifeSimSlash?.sendMessage?.(
            `📵 통화 종료 (통화시간: ${minutes}분 ${seconds}초)`
        );
        
        // 타이머 정지
        if (callTimerInterval) {
            clearInterval(callTimerInterval);
            callTimerInterval = null;
        }
        
        // UI 제거
        const toolbar = document.getElementById('stls-active-call-toolbar');
        if (toolbar) {
            toolbar.remove();
        }
        
        // 저장 확인 다이얼로그
        window.STLifeSimPopup?.showConfirm?.(
            '이 구간을 통화 기록으로 저장하시겠습니까?',
            () => {
                saveCallToLogs(activeCall.contactName, duration);
            }
        );
        
        activeCall = null;
        callStartTime = null;
    }
    
    /**
     * 통화기록에 저장
     */
    function saveCallToLogs(contactName, durationSeconds) {
        const log = {
            id: Date.now().toString(),
            contactName: contactName,
            date: new Date().toISOString(),
            durationSeconds: durationSeconds,
            messages: [], // 실제로는 통화 구간의 메시지를 저장해야 하지만 단순화
            includeInContext: false
        };
        
        callLogs.unshift(log);
        saveCallLogs();
        
        window.STLifeSimUI?.showSuccess?.('통화 기록이 저장되었습니다.');
    }
    
    /**
     * 부재중 전화 다이얼로그
     */
    function showMissedCallDialog() {
        const content = document.createElement('div');
        
        // 연락처 옵션 생성
        const contacts = window.STLifeSimContacts?.getContacts?.() || [];
        let contactOptions = '<option value="">선택하세요</option>';
        contacts.forEach(contact => {
            contactOptions += `<option value="${contact.name}">${contact.name}</option>`;
        });
        
        content.innerHTML = `
            <div class="stls-form-group">
                <label class="stls-form-label">연락처</label>
                <select class="stls-select" id="stls-missed-contact">
                    ${contactOptions}
                </select>
            </div>
            <div class="stls-form-group">
                <label class="stls-form-label">부재중 횟수</label>
                <input type="number" class="stls-input" id="stls-missed-count" value="3" min="1" max="99">
            </div>
        `;
        
        window.STLifeSimPopup?.createPopup?.({
            title: '📵 부재중 전화',
            content: content,
            buttons: [
                { text: '취소' },
                {
                    text: '전송',
                    primary: true,
                    onClick: async () => {
                        const contact = content.querySelector('#stls-missed-contact').value;
                        const count = content.querySelector('#stls-missed-count').value;
                        
                        if (!contact) {
                            window.STLifeSimUI?.showError?.('연락처를 선택해주세요.');
                            return;
                        }
                        
                        await window.STLifeSimSlash?.sendMessage?.(
                            `📵 부재중 전화 — ${contact} (${count}회)`
                        );
                        
                        window.STLifeSimUI?.showSuccess?.('부재중 전화를 전송했습니다.');
                    }
                }
            ]
        });
    }
    
    /**
     * 통화기록 패널 표시
     */
    function showCallLogsPanel() {
        const content = createCallLogsPanel();
        
        window.STLifeSimPopup?.createPopup?.({
            title: '📞 통화기록',
            content: content,
            width: '700px',
            height: '700px'
        });
    }
    
    /**
     * 통화기록 패널 생성
     */
    function createCallLogsPanel() {
        const container = document.createElement('div');
        
        // 탭 (전체, 연락처별)
        const uniqueContacts = [...new Set(callLogs.map(log => log.contactName))];
        const tabs = [
            { id: 'all', label: '전체' },
            ...uniqueContacts.map(name => ({ id: name, label: name }))
        ];
        
        const tabContainer = window.STLifeSimUI?.createTabs?.(tabs, 'all') || document.createElement('div');
        container.appendChild(tabContainer);
        
        // 탭 이벤트
        tabContainer.querySelectorAll('.stls-tab').forEach((tab, index) => {
            tab.addEventListener('click', () => {
                renderCallLogs(container, tabs[index].id);
            });
        });
        
        // 통화기록 리스트
        const listContainer = document.createElement('div');
        listContainer.id = 'stls-call-logs-list';
        listContainer.style.cssText = 'max-height: 500px; overflow-y: auto; margin-top: 15px;';
        container.appendChild(listContainer);
        
        // 초기 렌더링
        renderCallLogs(container, 'all');
        
        return container;
    }
    
    /**
     * 통화기록 렌더링
     */
    function renderCallLogs(container, filter) {
        const listContainer = container.querySelector('#stls-call-logs-list');
        if (!listContainer) return;
        
        // 필터링
        let filtered = callLogs;
        if (filter !== 'all') {
            filtered = callLogs.filter(log => log.contactName === filter);
        }
        
        listContainer.innerHTML = '';
        
        if (filtered.length === 0) {
            listContainer.innerHTML = '<p style="text-align: center; padding: 40px; color: #888;">통화 기록이 없습니다.</p>';
            return;
        }
        
        filtered.forEach(log => {
            const logEl = createCallLogElement(log, container);
            listContainer.appendChild(logEl);
        });
    }
    
    /**
     * 통화기록 엘리먼트 생성
     */
    function createCallLogElement(log, container) {
        const logEl = document.createElement('div');
        logEl.className = 'stls-call-log';
        
        const date = new Date(log.date);
        const dateStr = date.toLocaleDateString('ko-KR');
        
        const minutes = Math.floor(log.durationSeconds / 60);
        const seconds = log.durationSeconds % 60;
        const durationStr = minutes > 0 ? `${minutes}분 ${seconds}초` : `${seconds}초`;
        
        const header = document.createElement('div');
        header.className = 'stls-call-log-header';
        
        const info = document.createElement('div');
        info.className = 'stls-call-log-info';
        info.innerHTML = `
            <div class="stls-call-log-name">📞 ${log.contactName}</div>
            <div class="stls-call-log-meta">${dateStr}</div>
        `;
        
        const duration = document.createElement('div');
        duration.className = 'stls-call-log-duration';
        duration.textContent = durationStr;
        
        header.appendChild(info);
        header.appendChild(duration);
        logEl.appendChild(header);
        
        // 액션 버튼
        const actions = document.createElement('div');
        actions.className = 'stls-call-log-actions';
        
        const contextBtn = document.createElement('button');
        contextBtn.className = 'stls-btn';
        contextBtn.style.cssText = 'padding: 6px 12px; font-size: 13px;';
        contextBtn.textContent = log.includeInContext ? '컨텍스트: ON ✅' : '컨텍스트: OFF';
        contextBtn.addEventListener('click', () => {
            log.includeInContext = !log.includeInContext;
            saveCallLogs();
            renderCallLogs(container, 'all');
        });
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'stls-btn';
        deleteBtn.style.cssText = 'padding: 6px 12px; font-size: 13px;';
        deleteBtn.textContent = '삭제';
        deleteBtn.addEventListener('click', () => {
            window.STLifeSimPopup?.showConfirm?.(
                '이 통화 기록을 삭제하시겠습니까?',
                () => {
                    callLogs = callLogs.filter(l => l.id !== log.id);
                    saveCallLogs();
                    renderCallLogs(container, 'all');
                    window.STLifeSimUI?.showSuccess?.('통화 기록을 삭제했습니다.');
                }
            );
        });
        
        actions.appendChild(contextBtn);
        actions.appendChild(deleteBtn);
        logEl.appendChild(actions);
        
        return logEl;
    }
    
    /**
     * 컨텍스트 생성
     */
    function getContext() {
        const contextLogs = callLogs.filter(log => log.includeInContext).slice(0, 3);
        
        if (contextLogs.length === 0) {
            return null;
        }
        
        let context = '=== 최근 통화 기록 ===\n';
        contextLogs.forEach(log => {
            const date = new Date(log.date);
            const dateStr = date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
            const minutes = Math.floor(log.durationSeconds / 60);
            context += `• ${log.contactName} (${dateStr}, ${minutes}분)\n`;
        });
        
        return context;
    }
    
    // 외부로 내보내기
    window.STLifeSimCall = {
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
