/* ===========================================
   quick-tools.js - 퀵 도구 모음
   =========================================== */

(function() {
    'use strict';
    
    // 설정
    let settings = {
        quickSendShortcut: 'Ctrl+Shift+Enter'
    };
    
    // 사건 기록 저장소
    let eventArchive = [];
    
    /**
     * 초기화
     */
    function initialize() {
        console.log('[ST-LifeSim] Quick Tools 모듈 로딩...');
        
        // 저장된 사건 기록 불러오기
        loadEventArchive();
        
        // 툴바 생성
        createToolbar();
        
        // 단축키 등록
        registerShortcuts();
        
        console.log('[ST-LifeSim] Quick Tools 모듈 로드 완료');
    }
    
    /**
     * 사건 기록 불러오기
     */
    function loadEventArchive() {
        const storage = window.STLifeSimStorage;
        if (storage) {
            eventArchive = storage.loadData('eventArchive', [], storage.STORAGE_TYPE.CHAT);
        }
    }
    
    /**
     * 사건 기록 저장
     */
    function saveEventArchive() {
        const storage = window.STLifeSimStorage;
        if (storage) {
            storage.saveData('eventArchive', eventArchive, storage.STORAGE_TYPE.CHAT);
        }
    }
    
    /**
     * 툴바 생성
     */
    function createToolbar() {
        // 채팅 입력창 찾기
        const chatArea = document.querySelector('#send_textarea') || document.querySelector('.send_textarea');
        if (!chatArea || !chatArea.parentElement) {
            console.warn('[ST-LifeSim] 채팅 입력창을 찾을 수 없습니다.');
            return;
        }
        
        // 툴바 컨테이너 생성
        const toolbar = document.createElement('div');
        toolbar.className = 'stls-toolbar';
        toolbar.id = 'stls-quick-toolbar';
        toolbar.style.cssText = 'margin-bottom: 10px;';
        
        // 퀵센드 버튼
        const quickSendBtn = createButton('📨 퀵센드', () => quickSend());
        toolbar.appendChild(quickSendBtn);
        
        // 시간 구분선 버튼
        const timeSeparatorBtn = createButton('⏱️ 구분선', (e) => showTimeSeparatorMenu(e.target));
        toolbar.appendChild(timeSeparatorBtn);
        
        // 읽씹 버튼
        const readReceiptBtn = createButton('👻 읽씹', () => executeReadReceipt());
        toolbar.appendChild(readReceiptBtn);
        
        // 연락 안됨 버튼
        const unreachableBtn = createButton('📵 연락안됨', () => executeUnreachable());
        toolbar.appendChild(unreachableBtn);
        
        // 사건 생성 버튼
        const eventBtn = createButton('⚡ 사건생성', (e) => showEventMenu(e.target));
        toolbar.appendChild(eventBtn);
        
        // 사건 기록 보기 버튼
        const eventArchiveBtn = createButton('📜 사건기록', () => showEventArchive());
        toolbar.appendChild(eventArchiveBtn);
        
        // 음성메모 버튼
        const voiceMemoBtn = createButton('🎤 음성메모', () => showVoiceMemoDialog());
        toolbar.appendChild(voiceMemoBtn);
        
        // 툴바를 입력창 위에 삽입
        chatArea.parentElement.insertBefore(toolbar, chatArea);
    }
    
    /**
     * 버튼 생성 헬퍼
     */
    function createButton(text, onClick) {
        const btn = document.createElement('button');
        btn.className = 'stls-toolbar-btn';
        btn.textContent = text;
        btn.addEventListener('click', onClick);
        return btn;
    }
    
    /**
     * 퀵센드 실행
     */
    async function quickSend() {
        const textarea = document.querySelector('#send_textarea') || document.querySelector('.send_textarea');
        if (!textarea || !textarea.value.trim()) {
            window.STLifeSimUI?.showError?.('전송할 메시지가 없습니다.');
            return;
        }
        
        const text = textarea.value.trim();
        await window.STLifeSimSlash?.sendMessage?.(text);
        
        // 입력창 비우기
        textarea.value = '';
        window.STLifeSimUI?.showSuccess?.('메시지를 전송했습니다.');
    }
    
    /**
     * 시간 구분선 메뉴 표시
     */
    function showTimeSeparatorMenu(anchorEl) {
        const items = [
            { text: '30분 후', onClick: () => insertTimeSeparator('30분 후') },
            { text: '1시간 후', onClick: () => insertTimeSeparator('1시간 후') },
            { text: '3시간 후', onClick: () => insertTimeSeparator('3시간 후') },
            { text: '다음날', onClick: () => insertTimeSeparator('다음날') },
            { text: '1주일 후', onClick: () => insertTimeSeparator('1주일 후') },
            { text: '직접 입력', onClick: () => customTimeSeparator() }
        ];
        
        window.STLifeSimUI?.createDropdown?.(items, anchorEl);
    }
    
    /**
     * 시간 구분선 삽입
     */
    async function insertTimeSeparator(timeText) {
        const separator = `─────────── ${timeText} ───────────`;
        await window.STLifeSimSlash?.sendMessage?.(separator);
        window.STLifeSimUI?.showSuccess?.('구분선을 삽입했습니다.');
    }
    
    /**
     * 커스텀 시간 구분선
     */
    function customTimeSeparator() {
        window.STLifeSimPopup?.showPrompt?.('시간 텍스트를 입력하세요', '', (text) => {
            if (text) {
                insertTimeSeparator(text);
            }
        });
    }
    
    /**
     * 읽씹 연출 실행
     */
    async function executeReadReceipt() {
        const slash = window.STLifeSimSlash;
        if (!slash) return;
        
        // 1. 읽음 표시
        await slash.sendMessage('읽음 ✓✓');
        
        // 2. AI가 읽씹 상황 묘사
        setTimeout(async () => {
            const charName = slash.getCurrentCharacterName();
            const prompt = `${charName}는 메시지를 읽었지만 아직 답장하지 않은 상황을 짧게 묘사하라.`;
            await slash.generateAndSend(prompt, charName);
        }, 500);
        
        window.STLifeSimUI?.showSuccess?.('읽씹 연출을 시작했습니다.');
    }
    
    /**
     * 연락 안됨 연출 실행
     */
    async function executeUnreachable() {
        const slash = window.STLifeSimSlash;
        if (!slash) return;
        
        // 1. 연결 안됨 메시지
        await slash.sendMessage('📵 연결되지 않습니다');
        
        // 2. AI가 연락 안됨 상황 묘사
        setTimeout(async () => {
            const charName = slash.getCurrentCharacterName();
            const prompt = `${charName}에게 연락이 닿지 않는다. 전화를 받지 않거나 메시지 미확인 상태인 상황을 짧게 묘사하라.`;
            await slash.generateAndSend(prompt, charName);
        }, 500);
        
        window.STLifeSimUI?.showSuccess?.('연락 안됨 연출을 시작했습니다.');
    }
    
    /**
     * 사건 생성 메뉴 표시
     */
    function showEventMenu(anchorEl) {
        const items = [
            { text: '📰 일상', onClick: () => generateEvent('일상') },
            { text: '💼 직장/학교', onClick: () => generateEvent('직장/학교') },
            { text: '❤️ 관계', onClick: () => generateEvent('관계') },
            { text: '🌧️ 사고', onClick: () => generateEvent('사고') },
            { text: '🎉 좋은일', onClick: () => generateEvent('좋은일') },
            { text: '⚡ 긴급', onClick: () => generateEvent('긴급') },
            { text: '🎲 랜덤', onClick: () => generateEvent('랜덤') }
        ];
        
        window.STLifeSimUI?.createDropdown?.(items, anchorEl);
    }
    
    /**
     * 사건 생성
     */
    async function generateEvent(category) {
        const slash = window.STLifeSimSlash;
        if (!slash) return;
        
        window.STLifeSimUI?.showLoading?.(true);
        
        const charName = slash.getCurrentCharacterName();
        const prompt = `${category} 분류의 사건이 발생했다. 현재 상황에 어울리는 사건을 간결하게 묘사하라.`;
        
        // 사건 생성 (AI 응답 대기)
        await slash.generateAndSend(prompt, charName);
        
        // 사건 기록에 저장
        const event = {
            id: Date.now().toString(),
            category: category,
            date: new Date().toISOString(),
            includeInContext: false
        };
        eventArchive.unshift(event);
        saveEventArchive();
        
        window.STLifeSimUI?.showLoading?.(false);
        window.STLifeSimUI?.showSuccess?.(`${category} 사건을 생성했습니다.`);
    }
    
    /**
     * 사건 기록 보기
     */
    function showEventArchive() {
        const content = document.createElement('div');
        
        if (eventArchive.length === 0) {
            content.innerHTML = '<p style="padding: 20px; text-align: center; color: #888;">저장된 사건이 없습니다.</p>';
        } else {
            let html = '<div style="max-height: 400px; overflow-y: auto;">';
            
            eventArchive.forEach(event => {
                const date = new Date(event.date);
                const dateStr = date.toLocaleString('ko-KR');
                
                html += `
                    <div style="padding: 10px; margin-bottom: 10px; border: 1px solid var(--SmartThemeBorderColor, #333); border-radius: 4px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                            <strong>${event.category}</strong>
                            <span style="color: #888; font-size: 12px;">${dateStr}</span>
                        </div>
                        <div style="margin-top: 5px;">
                            <label style="font-size: 13px;">
                                <input type="checkbox" data-event-id="${event.id}" ${event.includeInContext ? 'checked' : ''}>
                                컨텍스트 포함
                            </label>
                            <button class="stls-btn" style="margin-left: 10px; padding: 4px 8px; font-size: 12px;" data-delete-id="${event.id}">삭제</button>
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
            content.innerHTML = html;
            
            // 이벤트 리스너
            content.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    const eventId = e.target.getAttribute('data-event-id');
                    const event = eventArchive.find(ev => ev.id === eventId);
                    if (event) {
                        event.includeInContext = e.target.checked;
                        saveEventArchive();
                    }
                });
            });
            
            content.querySelectorAll('[data-delete-id]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const eventId = e.target.getAttribute('data-delete-id');
                    eventArchive = eventArchive.filter(ev => ev.id !== eventId);
                    saveEventArchive();
                    showEventArchive(); // 다시 열기
                    window.STLifeSimUI?.showSuccess?.('사건을 삭제했습니다.');
                });
            });
        }
        
        window.STLifeSimPopup?.createPopup?.({
            title: '📜 사건 기록',
            content: content,
            width: '600px',
            buttons: [
                { text: '닫기' }
            ]
        });
    }
    
    /**
     * 음성메모 다이얼로그
     */
    function showVoiceMemoDialog() {
        const content = document.createElement('div');
        content.innerHTML = `
            <div class="stls-form-group">
                <label class="stls-form-label">길이 (초)</label>
                <input type="number" class="stls-input" id="stls-voice-duration" value="23" min="1" max="999">
            </div>
            <div class="stls-form-group">
                <label class="stls-form-label">내용 힌트 (선택사항)</label>
                <input type="text" class="stls-input" id="stls-voice-hint" placeholder="예: 오늘 늦겠다고">
            </div>
        `;
        
        window.STLifeSimPopup?.createPopup?.({
            title: '🎤 음성메모',
            content: content,
            buttons: [
                { text: '취소' },
                {
                    text: '전송',
                    primary: true,
                    onClick: async () => {
                        const duration = document.getElementById('stls-voice-duration')?.value || '23';
                        const hint = document.getElementById('stls-voice-hint')?.value || '';
                        
                        const slash = window.STLifeSimSlash;
                        if (!slash) return;
                        
                        // 음성메시지 표시
                        const minutes = Math.floor(duration / 60);
                        const seconds = duration % 60;
                        const timeStr = minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : `0:${seconds}`;
                        
                        await slash.sendMessage(`🎤 음성메시지 (${timeStr})`);
                        
                        // 힌트가 있으면 AI 반응 생성
                        if (hint) {
                            setTimeout(async () => {
                                const charName = slash.getCurrentCharacterName();
                                const prompt = `${charName}에게 음성메시지가 도착했다. 내용: ${hint}. 이에 반응하라.`;
                                await slash.generateAndSend(prompt, charName);
                            }, 500);
                        }
                        
                        window.STLifeSimUI?.showSuccess?.('음성메모를 전송했습니다.');
                    }
                }
            ]
        });
    }
    
    /**
     * 단축키 등록
     */
    function registerShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+Enter: 퀵센드
            if (e.ctrlKey && e.shiftKey && e.key === 'Enter') {
                e.preventDefault();
                quickSend();
            }
        });
    }
    
    /**
     * 컨텍스트 생성
     */
    function getEventContext() {
        const includeEvents = eventArchive.filter(event => event.includeInContext);
        
        if (includeEvents.length === 0) {
            return null;
        }
        
        let context = '=== 최근 발생한 사건 ===\n';
        includeEvents.slice(0, 5).forEach(event => {
            const date = new Date(event.date);
            const dateStr = date.toLocaleDateString('ko-KR');
            context += `• ${event.category} (${dateStr})\n`;
        });
        
        return context;
    }
    
    // 외부로 내보내기
    window.STLifeSimQuickTools = {
        initialize,
        getEventContext
    };
    
    // 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();
