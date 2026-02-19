/* ============================================================================
 * wallet.js - 지갑 & 송금 모듈
 * ============================================================================
 * 가상 화폐 시스템
 * - 커스텀 화폐 이름/기호 설정
 * - 잔액 관리 (충전/차감)
 * - 송금 기능 (연락처 연동)
 * - 거래 내역
 * ========================================================================== */

import { storage } from '../../utils/storage.js';
import { send } from '../../utils/slash.js';
import { createPopup, confirm, prompt as inputPrompt } from '../../utils/popup.js';
import { showSuccess, showError, createElement, createTabs } from '../../utils/ui.js';
import { contextInjector, formatSection } from '../../utils/context-inject.js';

let walletData = {
    currencyName: '골드',
    currencySymbol: 'G',
    balance: 1000000,
    history: []
};
let popupInstance = null;

/**
 * 모듈 초기화
 */
export async function init() {
    console.log('[Wallet] 모듈 초기화...');
    
    // CSS 로드
    loadCSS();
    
    // 데이터 로드
    loadWallet();
    
    // 툴바 버튼 추가
    addToolbarButton();
    
    // 컨텍스트 주입 등록
    contextInjector.register('wallet', generateContext);
    
    console.log('[Wallet] 모듈 초기화 완료');
}

/**
 * 모듈 정리
 */
export function cleanup() {
    contextInjector.unregister('wallet');
    
    const btn = document.querySelector('#stls-wallet-btn');
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
    link.href = new URL('./wallet.css', import.meta.url).href;
    document.head.appendChild(link);
}

/**
 * 툴바 버튼 추가
 */
function addToolbarButton() {
    const toolbar = document.querySelector('#stls-quick-toolbar');
    if (!toolbar) {
        console.warn('[Wallet] 퀵 툴바를 찾을 수 없습니다.');
        return;
    }
    
    const btn = createElement('button', {
        id: 'stls-wallet-btn',
        className: 'stls-toolbar-btn',
        onClick: showWalletPopup
    }, '💰 지갑');
    
    toolbar.appendChild(btn);
}

/**
 * 지갑 팝업 표시
 */
function showWalletPopup() {
    const tabs = [
        {
            id: 'main',
            label: '지갑',
            content: createMainTab
        },
        {
            id: 'history',
            label: '내역',
            content: createHistoryTab
        },
        {
            id: 'settings',
            label: '설정',
            content: createSettingsTab
        }
    ];
    
    const tabContainer = createTabs(tabs, 'main');
    
    popupInstance = createPopup({
        title: '💰 지갑',
        content: tabContainer,
        buttons: [
            {
                text: '닫기',
                className: 'stls-btn-secondary'
            }
        ],
        width: '600px',
        height: '650px',
        onClose: () => {
            popupInstance = null;
        }
    });
}

/**
 * 메인 탭 (잔액 & 송금)
 */
function createMainTab() {
    const container = createElement('div');
    
    // 잔액 표시
    const balanceSection = createElement('div', { className: 'stls-wallet-balance' });
    balanceSection.innerHTML = `
        <div class="stls-wallet-balance-label">잔액</div>
        <div class="stls-wallet-balance-amount">${walletData.currencySymbol} ${formatNumber(walletData.balance)}</div>
    `;
    
    // 충전/차감 버튼
    const actions = createElement('div', { className: 'stls-wallet-actions' });
    
    const chargeBtn = createElement('button', {
        className: 'stls-btn stls-btn-primary',
        onClick: handleCharge
    }, '+ 충전');
    
    const deductBtn = createElement('button', {
        className: 'stls-btn stls-btn-secondary',
        onClick: handleDeduct
    }, '- 차감');
    
    actions.appendChild(chargeBtn);
    actions.appendChild(deductBtn);
    
    // 송금 폼
    const transferForm = createElement('div', { className: 'stls-wallet-transfer-form' });
    transferForm.innerHTML = `
        <h4 style="margin-bottom: 12px;">송금하기</h4>
        
        <div class="stls-form-group">
            <label class="stls-label">받는 사람</label>
            <input type="text" class="stls-input" id="transfer-recipient" placeholder="이름 입력" />
        </div>
        
        <div class="stls-form-group">
            <label class="stls-label">금액</label>
            <input type="number" class="stls-input" id="transfer-amount" placeholder="0" min="0" />
        </div>
        
        <div class="stls-form-group">
            <label class="stls-label">메모</label>
            <input type="text" class="stls-input" id="transfer-memo" placeholder="예: 밥값" />
        </div>
        
        <button class="stls-btn stls-btn-primary" id="transfer-btn" style="width: 100%;">송금 확인</button>
    `;
    
    container.appendChild(balanceSection);
    container.appendChild(actions);
    container.appendChild(transferForm);
    
    // 송금 버튼 이벤트
    setTimeout(() => {
        const transferBtn = container.querySelector('#transfer-btn');
        transferBtn.addEventListener('click', handleTransfer);
    }, 100);
    
    return container;
}

/**
 * 내역 탭
 */
function createHistoryTab() {
    const container = createElement('div');
    
    const historyList = createElement('div', { className: 'stls-wallet-history' });
    
    if (walletData.history.length === 0) {
        historyList.innerHTML = '<div class="stls-wallet-empty">거래 내역이 없습니다.</div>';
    } else {
        // 최신순 정렬
        const sorted = [...walletData.history].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );
        
        sorted.forEach(tx => {
            const item = createElement('div', {
                className: `stls-wallet-history-item ${tx.type}`
            });
            
            const icon = tx.type === 'send' ? '📤' : '📥';
            const sign = tx.type === 'send' ? '-' : '+';
            
            const date = new Date(tx.date);
            const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
            
            item.innerHTML = `
                <div class="stls-wallet-history-icon">${icon}</div>
                <div class="stls-wallet-history-info">
                    <div class="stls-wallet-history-counterpart">${tx.counterpart}</div>
                    ${tx.note ? `<div class="stls-wallet-history-note">${tx.note}</div>` : ''}
                    <div class="stls-wallet-history-date">${dateStr}</div>
                </div>
                <div class="stls-wallet-history-amount ${tx.type}">
                    ${sign}${walletData.currencySymbol} ${formatNumber(tx.amount)}
                </div>
            `;
            
            historyList.appendChild(item);
        });
    }
    
    container.appendChild(historyList);
    
    return container;
}

/**
 * 설정 탭
 */
function createSettingsTab() {
    const container = createElement('div', { className: 'stls-wallet-settings' });
    
    container.innerHTML = `
        <div class="stls-form-group">
            <label class="stls-label">화폐 이름</label>
            <input type="text" class="stls-input" id="currency-name" value="${walletData.currencyName}" placeholder="예: 골드, 크레딧, 원" />
        </div>
        
        <div class="stls-form-group">
            <label class="stls-label">화폐 기호</label>
            <input type="text" class="stls-input" id="currency-symbol" value="${walletData.currencySymbol}" placeholder="예: G, ¢, ₩" />
        </div>
        
        <button class="stls-btn stls-btn-primary" id="save-settings-btn">설정 저장</button>
    `;
    
    // 저장 버튼 이벤트
    setTimeout(() => {
        const saveBtn = container.querySelector('#save-settings-btn');
        saveBtn.addEventListener('click', () => {
            const name = container.querySelector('#currency-name').value.trim();
            const symbol = container.querySelector('#currency-symbol').value.trim();
            
            if (!name || !symbol) {
                showError('화폐 이름과 기호를 입력해주세요.');
                return;
            }
            
            walletData.currencyName = name;
            walletData.currencySymbol = symbol;
            saveWallet();
            
            showSuccess('설정을 저장했습니다.');
            
            // 팝업 새로고침
            showWalletPopup();
        });
    }, 100);
    
    return container;
}

/**
 * 충전
 */
async function handleCharge() {
    const amount = await inputPrompt('충전할 금액을 입력하세요:', '');
    if (!amount) return;
    
    const value = parseInt(amount);
    if (isNaN(value) || value <= 0) {
        showError('올바른 금액을 입력해주세요.');
        return;
    }
    
    walletData.balance += value;
    
    walletData.history.push({
        id: Date.now().toString(),
        type: 'receive',
        amount: value,
        counterpart: '충전',
        note: '',
        date: new Date().toISOString(),
        balanceAfter: walletData.balance
    });
    
    saveWallet();
    showSuccess(`${walletData.currencySymbol} ${formatNumber(value)}을(를) 충전했습니다.`);
    
    // 팝업 새로고침
    showWalletPopup();
}

/**
 * 차감
 */
async function handleDeduct() {
    const amount = await inputPrompt('차감할 금액을 입력하세요:', '');
    if (!amount) return;
    
    const value = parseInt(amount);
    if (isNaN(value) || value <= 0) {
        showError('올바른 금액을 입력해주세요.');
        return;
    }
    
    if (value > walletData.balance) {
        showError('잔액이 부족합니다.');
        return;
    }
    
    walletData.balance -= value;
    
    walletData.history.push({
        id: Date.now().toString(),
        type: 'send',
        amount: value,
        counterpart: '차감',
        note: '',
        date: new Date().toISOString(),
        balanceAfter: walletData.balance
    });
    
    saveWallet();
    showSuccess(`${walletData.currencySymbol} ${formatNumber(value)}을(를) 차감했습니다.`);
    
    // 팝업 새로고침
    showWalletPopup();
}

/**
 * 송금
 */
async function handleTransfer() {
    const recipient = document.querySelector('#transfer-recipient')?.value.trim();
    const amount = parseInt(document.querySelector('#transfer-amount')?.value);
    const memo = document.querySelector('#transfer-memo')?.value.trim();
    
    if (!recipient) {
        showError('받는 사람을 입력해주세요.');
        return;
    }
    
    if (isNaN(amount) || amount <= 0) {
        showError('올바른 금액을 입력해주세요.');
        return;
    }
    
    if (amount > walletData.balance) {
        showError('잔액이 부족합니다.');
        return;
    }
    
    const confirmed = await confirm(`${recipient}에게 ${walletData.currencySymbol} ${formatNumber(amount)}을(를) 송금하시겠습니까?`);
    if (!confirmed) return;
    
    // 잔액 차감
    walletData.balance -= amount;
    
    // 내역 추가
    walletData.history.push({
        id: Date.now().toString(),
        type: 'send',
        amount,
        counterpart: recipient,
        note: memo,
        date: new Date().toISOString(),
        balanceAfter: walletData.balance
    });
    
    saveWallet();
    
    // 채팅에 송금 메시지 삽입
    const date = new Date();
    const dateStr = `${date.getMonth() + 1}월 ${date.getDate()}일 ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    
    const message = `━━━━━━━━━━━━
💸 송금 완료
━━━━━━━━━━━━
받는 분: ${recipient}
금  액: ${walletData.currencySymbol} ${formatNumber(amount)}
${memo ? `메  모: ${memo}\n` : ''}잔  액: ${walletData.currencySymbol} ${formatNumber(walletData.balance)}
일  시: ${dateStr}
━━━━━━━━━━━━`;
    
    try {
        await send(message);
        showSuccess('송금이 완료되었습니다.');
        
        // 팝업 새로고침
        showWalletPopup();
    } catch (error) {
        showError('송금 메시지 전송 실패: ' + error.message);
    }
}

/**
 * 숫자 포맷팅
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 지갑 데이터 로드
 */
function loadWallet() {
    const saved = storage.getData('wallet', 'data', null, 'chat');
    if (saved) {
        walletData = saved;
    }
}

/**
 * 지갑 데이터 저장
 */
function saveWallet() {
    storage.setData('wallet', 'data', walletData, 'chat');
}

/**
 * 컨텍스트 생성
 */
function generateContext() {
    return formatSection(
        `지갑 (${walletData.currencyName} ${walletData.currencySymbol})`,
        [`현재 잔액: ${walletData.currencySymbol} ${formatNumber(walletData.balance)}`]
    );
}

export default {
    init,
    cleanup
};
