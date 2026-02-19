/* ===========================================
   wallet.js - 지갑 & 송금 모듈
   =========================================== */

(function() {
    'use strict';
    
    // 지갑 데이터
    let wallet = {
        currencyName: '원',
        currencySymbol: '₩',
        balance: 1000000,
        history: []
    };
    
    /**
     * 초기화
     */
    function initialize() {
        console.log('[ST-LifeSim] Wallet 모듈 로딩...');
        
        // 저장된 지갑 불러오기
        loadWallet();
        
        // 툴바에 버튼 추가
        addToolbarButton();
        
        console.log('[ST-LifeSim] Wallet 모듈 로드 완료');
    }
    
    /**
     * 지갑 불러오기
     */
    function loadWallet() {
        const storage = window.STLifeSimStorage;
        if (storage) {
            const saved = storage.loadData('wallet', null, storage.STORAGE_TYPE.CHAT);
            if (saved) {
                wallet = saved;
            }
        }
    }
    
    /**
     * 지갑 저장
     */
    function saveWallet() {
        const storage = window.STLifeSimStorage;
        if (storage) {
            storage.saveData('wallet', wallet, storage.STORAGE_TYPE.CHAT);
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
        btn.textContent = '💰 지갑';
        btn.addEventListener('click', showWalletPanel);
        toolbar.appendChild(btn);
    }
    
    /**
     * 지갑 패널 표시
     */
    function showWalletPanel() {
        const content = createWalletPanel();
        
        window.STLifeSimPopup?.createPopup?.({
            title: '💰 지갑',
            content: content,
            width: '600px',
            height: '700px'
        });
    }
    
    /**
     * 지갑 패널 생성
     */
    function createWalletPanel() {
        const container = document.createElement('div');
        
        // 잔액 표시
        const balanceSection = document.createElement('div');
        balanceSection.className = 'stls-wallet-balance';
        balanceSection.innerHTML = `
            <div class="stls-wallet-balance-label">잔액</div>
            <div class="stls-wallet-balance-amount">${wallet.currencySymbol} ${formatNumber(wallet.balance)}</div>
        `;
        container.appendChild(balanceSection);
        
        // 액션 버튼
        const actions = document.createElement('div');
        actions.className = 'stls-wallet-actions';
        
        const addBtn = document.createElement('button');
        addBtn.className = 'stls-btn stls-btn-primary';
        addBtn.style.flex = '1';
        addBtn.textContent = '+ 충전';
        addBtn.addEventListener('click', () => showAdjustBalanceDialog('add'));
        
        const subtractBtn = document.createElement('button');
        subtractBtn.className = 'stls-btn';
        subtractBtn.style.flex = '1';
        subtractBtn.textContent = '- 차감';
        subtractBtn.addEventListener('click', () => showAdjustBalanceDialog('subtract'));
        
        const settingsBtn = document.createElement('button');
        settingsBtn.className = 'stls-btn';
        settingsBtn.style.flex = '1';
        settingsBtn.textContent = '⚙️ 설정';
        settingsBtn.addEventListener('click', () => showWalletSettings());
        
        actions.appendChild(addBtn);
        actions.appendChild(subtractBtn);
        actions.appendChild(settingsBtn);
        container.appendChild(actions);
        
        // 송금 섹션
        const sendSection = document.createElement('div');
        sendSection.className = 'stls-wallet-section';
        sendSection.innerHTML = `
            <div class="stls-wallet-section-title">송금하기</div>
            <div class="stls-form-group">
                <label class="stls-form-label">받는 사람</label>
                <select class="stls-select" id="stls-wallet-recipient">
                    <option value="">선택하세요</option>
                </select>
            </div>
            <div class="stls-form-group">
                <label class="stls-form-label">금액</label>
                <input type="number" class="stls-input" id="stls-wallet-amount" placeholder="금액 입력" min="0">
            </div>
            <div class="stls-form-group">
                <label class="stls-form-label">메모</label>
                <input type="text" class="stls-input" id="stls-wallet-memo" placeholder="메모 (선택사항)">
            </div>
            <button class="stls-btn stls-btn-primary" id="stls-wallet-send-btn" style="width: 100%;">송금 확인</button>
        `;
        container.appendChild(sendSection);
        
        // 연락처 목록 채우기
        const recipientSelect = sendSection.querySelector('#stls-wallet-recipient');
        const contacts = window.STLifeSimContacts?.getContacts?.() || [];
        contacts.forEach(contact => {
            const option = document.createElement('option');
            option.value = contact.name;
            option.textContent = contact.name;
            recipientSelect.appendChild(option);
        });
        
        // 송금 버튼 이벤트
        sendSection.querySelector('#stls-wallet-send-btn').addEventListener('click', () => {
            const recipient = recipientSelect.value;
            const amount = parseInt(sendSection.querySelector('#stls-wallet-amount').value);
            const memo = sendSection.querySelector('#stls-wallet-memo').value.trim();
            
            if (!recipient) {
                window.STLifeSimUI?.showError?.('받는 사람을 선택해주세요.');
                return;
            }
            
            if (!amount || amount <= 0) {
                window.STLifeSimUI?.showError?.('올바른 금액을 입력해주세요.');
                return;
            }
            
            if (amount > wallet.balance) {
                window.STLifeSimUI?.showError?.('잔액이 부족합니다.');
                return;
            }
            
            window.STLifeSimPopup?.showConfirm?.(
                `${recipient}님께 ${wallet.currencySymbol}${formatNumber(amount)}을 송금하시겠습니까?`,
                () => {
                    executeSend(recipient, amount, memo);
                    // 패널 새로고침
                    showWalletPanel();
                }
            );
        });
        
        // 거래 내역
        const historySection = document.createElement('div');
        historySection.className = 'stls-wallet-section';
        historySection.innerHTML = '<div class="stls-wallet-section-title">거래 내역</div>';
        
        const historyList = document.createElement('div');
        historyList.className = 'stls-wallet-history';
        
        if (wallet.history.length === 0) {
            historyList.innerHTML = '<p style="text-align: center; padding: 20px; color: #888;">거래 내역이 없습니다.</p>';
        } else {
            // 최근 내역부터 표시
            const sortedHistory = [...wallet.history].reverse();
            sortedHistory.forEach(item => {
                const historyItem = createHistoryItem(item);
                historyList.appendChild(historyItem);
            });
        }
        
        historySection.appendChild(historyList);
        container.appendChild(historySection);
        
        return container;
    }
    
    /**
     * 거래 내역 아이템 생성
     */
    function createHistoryItem(item) {
        const div = document.createElement('div');
        div.className = 'stls-wallet-history-item';
        
        const icon = item.type === 'send' ? '📤' : '📥';
        const amountClass = item.type === 'send' ? 'send' : 'receive';
        const amountPrefix = item.type === 'send' ? '-' : '+';
        
        const date = new Date(item.date);
        const dateStr = date.toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        
        div.innerHTML = `
            <div style="display: flex; align-items: center; flex: 1;">
                <span class="stls-wallet-history-icon">${icon}</span>
                <div class="stls-wallet-history-info">
                    <div class="stls-wallet-history-name">${item.counterpart || item.note}</div>
                    ${item.note && item.counterpart ? `<div class="stls-wallet-history-note">${item.note}</div>` : ''}
                </div>
            </div>
            <div style="text-align: right;">
                <div class="stls-wallet-history-amount ${amountClass}">${amountPrefix}${wallet.currencySymbol}${formatNumber(item.amount)}</div>
                <div class="stls-wallet-history-date">${dateStr}</div>
            </div>
        `;
        
        return div;
    }
    
    /**
     * 송금 실행
     */
    async function executeSend(recipient, amount, memo) {
        // 잔액 차감
        wallet.balance -= amount;
        
        // 거래 내역 추가
        const transaction = {
            id: Date.now().toString(),
            type: 'send',
            amount: amount,
            counterpart: recipient,
            note: memo,
            date: new Date().toISOString(),
            balanceAfter: wallet.balance
        };
        wallet.history.push(transaction);
        
        saveWallet();
        
        // 채팅에 영수증 전송
        const receipt = generateReceipt(transaction);
        await window.STLifeSimSlash?.sendMessage?.(receipt);
        
        window.STLifeSimUI?.showSuccess?.('송금이 완료되었습니다.');
    }
    
    /**
     * 영수증 생성
     */
    function generateReceipt(transaction) {
        const date = new Date(transaction.date);
        const dateStr = date.toLocaleString('ko-KR');
        
        return `━━━━━━━━━━━━
💸 송금 완료
━━━━━━━━━━━━
받는 분: ${transaction.counterpart}
금  액: ${wallet.currencySymbol} ${formatNumber(transaction.amount)}
${transaction.note ? `메  모: ${transaction.note}\n` : ''}잔  액: ${wallet.currencySymbol} ${formatNumber(transaction.balanceAfter)}
일  시: ${dateStr}
━━━━━━━━━━━━`;
    }
    
    /**
     * 잔액 조정 다이얼로그
     */
    function showAdjustBalanceDialog(type) {
        const title = type === 'add' ? '잔액 충전' : '잔액 차감';
        const label = type === 'add' ? '충전할 금액' : '차감할 금액';
        
        const content = document.createElement('div');
        content.innerHTML = `
            <div class="stls-form-group">
                <label class="stls-form-label">${label}</label>
                <input type="number" class="stls-input" id="stls-adjust-amount" placeholder="금액 입력" min="0">
            </div>
            <div class="stls-form-group">
                <label class="stls-form-label">메모</label>
                <input type="text" class="stls-input" id="stls-adjust-note" placeholder="예: 월급, 지출 등">
            </div>
        `;
        
        window.STLifeSimPopup?.createPopup?.({
            title: title,
            content: content,
            buttons: [
                { text: '취소' },
                {
                    text: '확인',
                    primary: true,
                    onClick: () => {
                        const amount = parseInt(content.querySelector('#stls-adjust-amount').value);
                        const note = content.querySelector('#stls-adjust-note').value.trim() || (type === 'add' ? '충전' : '차감');
                        
                        if (!amount || amount <= 0) {
                            window.STLifeSimUI?.showError?.('올바른 금액을 입력해주세요.');
                            return;
                        }
                        
                        if (type === 'add') {
                            wallet.balance += amount;
                        } else {
                            wallet.balance -= amount;
                        }
                        
                        wallet.history.push({
                            id: Date.now().toString(),
                            type: type === 'add' ? 'receive' : 'send',
                            amount: amount,
                            counterpart: null,
                            note: note,
                            date: new Date().toISOString(),
                            balanceAfter: wallet.balance
                        });
                        
                        saveWallet();
                        window.STLifeSimUI?.showSuccess?.(type === 'add' ? '충전이 완료되었습니다.' : '차감이 완료되었습니다.');
                        showWalletPanel(); // 패널 새로고침
                    }
                }
            ]
        });
    }
    
    /**
     * 지갑 설정 다이얼로그
     */
    function showWalletSettings() {
        const content = document.createElement('div');
        content.innerHTML = `
            <div class="stls-form-group">
                <label class="stls-form-label">화폐 이름</label>
                <input type="text" class="stls-input" id="stls-currency-name" value="${wallet.currencyName}" placeholder="예: 원, 골드, 크레딧">
            </div>
            <div class="stls-form-group">
                <label class="stls-form-label">화폐 기호</label>
                <input type="text" class="stls-input" id="stls-currency-symbol" value="${wallet.currencySymbol}" placeholder="예: ₩, G, ¢">
            </div>
            <p style="font-size: 12px; color: #888; margin-top: 10px;">
                * 화폐 설정을 변경해도 현재 잔액과 거래 내역은 유지됩니다.
            </p>
        `;
        
        window.STLifeSimPopup?.createPopup?.({
            title: '지갑 설정',
            content: content,
            buttons: [
                { text: '취소' },
                {
                    text: '저장',
                    primary: true,
                    onClick: () => {
                        const name = content.querySelector('#stls-currency-name').value.trim();
                        const symbol = content.querySelector('#stls-currency-symbol').value.trim();
                        
                        if (!name || !symbol) {
                            window.STLifeSimUI?.showError?.('화폐 이름과 기호를 입력해주세요.');
                            return;
                        }
                        
                        wallet.currencyName = name;
                        wallet.currencySymbol = symbol;
                        
                        saveWallet();
                        window.STLifeSimUI?.showSuccess?.('설정이 저장되었습니다.');
                        showWalletPanel(); // 패널 새로고침
                    }
                }
            ]
        });
    }
    
    /**
     * 숫자 포맷팅 (천 단위 콤마)
     */
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    
    /**
     * 컨텍스트 생성
     */
    function getContext() {
        return `=== 지갑 (${wallet.currencyName} ${wallet.currencySymbol}) ===
현재 잔액: ${wallet.currencySymbol} ${formatNumber(wallet.balance)}`;
    }
    
    // 외부로 내보내기
    window.STLifeSimWallet = {
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
