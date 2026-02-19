/* ============================================================================
 * settings.js - 설정 관리 UI
 * ============================================================================
 * 확장 설정 패널 생성 및 관리
 * 모듈별 ON/OFF, 바인딩 방식 등 설정
 * ========================================================================== */

import { storage } from './utils/storage.js';
import { contextInjector } from './utils/context-inject.js';
import { createPopup } from './utils/popup.js';
import { showSuccess, showError, createElement, createTabs } from './utils/ui.js';

/**
 * 설정 UI 생성 및 표시
 */
export function showSettings() {
    const tabs = [
        {
            id: 'general',
            label: '일반',
            content: createGeneralSettings
        },
        {
            id: 'modules',
            label: '모듈',
            content: createModuleSettings
        },
        {
            id: 'context',
            label: '컨텍스트',
            content: createContextSettings
        },
        {
            id: 'backup',
            label: '백업/복원',
            content: createBackupSettings
        }
    ];

    const tabContainer = createTabs(tabs, 'general');

    createPopup({
        title: '⚙️ ST-LifeSim 설정',
        content: tabContainer,
        width: '700px',
        height: '600px'
    });
}

/**
 * 일반 설정 탭
 */
function createGeneralSettings() {
    const container = createElement('div');
    
    const enabled = storage.settings?.enabled ?? true;
    
    container.innerHTML = `
        <div class="stls-form-group">
            <label class="stls-label">
                <input type="checkbox" id="stls-enabled" ${enabled ? 'checked' : ''} />
                확장 전체 활성화
            </label>
            <p class="stls-text-sm stls-text-muted">
                이 옵션을 끄면 모든 모듈이 비활성화됩니다.
            </p>
        </div>
        
        <div class="stls-form-group stls-mt-md">
            <h4>정보</h4>
            <p class="stls-text-sm">
                버전: 0.1.0<br>
                제작: gulggu<br>
                <a href="https://github.com/gulggu/STP" target="_blank">GitHub</a>
            </p>
        </div>
    `;
    
    // 이벤트 핸들러
    const enabledCheckbox = container.querySelector('#stls-enabled');
    enabledCheckbox.addEventListener('change', (e) => {
        storage.setExtensionEnabled(e.target.checked);
        showSuccess(e.target.checked ? '확장이 활성화되었습니다.' : '확장이 비활성화되었습니다.');
    });
    
    return container;
}

/**
 * 모듈 설정 탭
 */
function createModuleSettings() {
    const container = createElement('div');
    
    const modules = [
        { id: 'emoticon', name: '이모티콘', icon: '😊' },
        { id: 'contacts', name: 'NPC 연락처', icon: '📋' },
        { id: 'quickTools', name: '퀵 도구 모음', icon: '🛠️' },
        { id: 'call', name: '통화 & 통화기록', icon: '📞' },
        { id: 'wallet', name: '지갑 & 송금', icon: '💰' },
        { id: 'sns', name: 'SNS 피드', icon: '📸' },
        { id: 'calendar', name: '캘린더', icon: '📅' }
    ];
    
    let html = '<div class="stls-flex stls-flex-col stls-gap-md">';
    
    modules.forEach(module => {
        const enabled = storage.isModuleEnabled(module.id);
        html += `
            <div class="stls-form-group" style="border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px;">
                <label class="stls-label" style="display: flex; align-items: center; gap: 8px;">
                    <input type="checkbox" class="module-toggle" data-module="${module.id}" ${enabled ? 'checked' : ''} />
                    <span style="font-size: 20px;">${module.icon}</span>
                    <span>${module.name}</span>
                </label>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    // 이벤트 핸들러
    container.querySelectorAll('.module-toggle').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const moduleId = e.target.dataset.module;
            storage.setModuleEnabled(moduleId, e.target.checked);
            showSuccess(`${e.target.parentElement.textContent.trim()} 모듈이 ${e.target.checked ? '활성화' : '비활성화'}되었습니다.`);
        });
    });
    
    return container;
}

/**
 * 컨텍스트 설정 탭
 */
function createContextSettings() {
    const container = createElement('div');
    
    const totalTokens = contextInjector.estimateTokens();
    const moduleStatus = contextInjector.getModuleStatus();
    
    let html = `
        <div class="stls-form-group">
            <h4>컨텍스트 상태</h4>
            <p class="stls-text-sm stls-text-muted">
                현재 주입되는 총 토큰 추정치: <strong>${totalTokens}</strong>
            </p>
        </div>
        
        <div class="stls-form-group stls-mt-md">
            <h4>모듈별 토큰 사용량</h4>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 1px solid rgba(255,255,255,0.2);">
                        <th style="text-align: left; padding: 8px;">모듈</th>
                        <th style="text-align: center; padding: 8px;">상태</th>
                        <th style="text-align: right; padding: 8px;">토큰</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    Object.entries(moduleStatus).forEach(([moduleName, status]) => {
        const statusText = status.enabled 
            ? (status.hasContext ? '✅ 활성' : '⚪ 데이터 없음')
            : '❌ 비활성';
        
        html += `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                <td style="padding: 8px;">${moduleName}</td>
                <td style="text-align: center; padding: 8px;">${statusText}</td>
                <td style="text-align: right; padding: 8px;">${status.tokenEstimate}</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
        
        <div class="stls-form-group stls-mt-md">
            <button class="stls-btn stls-btn-secondary" id="stls-preview-context">
                컨텍스트 미리보기
            </button>
        </div>
    `;
    
    container.innerHTML = html;
    
    // 미리보기 버튼
    container.querySelector('#stls-preview-context').addEventListener('click', () => {
        const context = contextInjector.generateContext();
        const previewPopup = createPopup({
            title: '컨텍스트 미리보기',
            content: `<pre style="white-space: pre-wrap; max-height: 400px; overflow-y: auto;">${context || '(컨텍스트 없음)'}</pre>`,
            buttons: [
                {
                    text: '닫기',
                    className: 'stls-btn-secondary'
                }
            ],
            width: '700px'
        });
    });
    
    return container;
}

/**
 * 백업/복원 설정 탭
 */
function createBackupSettings() {
    const container = createElement('div');
    
    container.innerHTML = `
        <div class="stls-form-group">
            <h4>데이터 백업</h4>
            <p class="stls-text-sm stls-text-muted">
                모든 설정과 데이터를 JSON 파일로 내보냅니다.
            </p>
            <button class="stls-btn stls-btn-primary" id="stls-export">
                데이터 내보내기
            </button>
        </div>
        
        <div class="stls-form-group stls-mt-md">
            <h4>데이터 복원</h4>
            <p class="stls-text-sm stls-text-muted">
                백업한 JSON 파일을 가져와 데이터를 복원합니다.
            </p>
            <input type="file" id="stls-import-file" accept=".json" style="display: none;" />
            <button class="stls-btn stls-btn-secondary" id="stls-import">
                데이터 가져오기
            </button>
        </div>
        
        <div class="stls-form-group stls-mt-md">
            <h4>위험 구역</h4>
            <p class="stls-text-sm stls-text-muted" style="color: #e74c3c;">
                모든 데이터를 삭제합니다. 이 작업은 되돌릴 수 없습니다!
            </p>
            <button class="stls-btn stls-btn-danger" id="stls-reset">
                전체 데이터 삭제
            </button>
        </div>
    `;
    
    // 내보내기
    container.querySelector('#stls-export').addEventListener('click', () => {
        const data = storage.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `st-lifesim-backup-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showSuccess('데이터를 내보냈습니다.');
    });
    
    // 가져오기
    const fileInput = container.querySelector('#stls-import-file');
    container.querySelector('#stls-import').addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                storage.importData(data);
                showSuccess('데이터를 가져왔습니다. 페이지를 새로고침해주세요.');
            } catch (error) {
                showError('데이터 가져오기 실패: ' + error.message);
            }
        };
        reader.readAsText(file);
    });
    
    // 리셋
    container.querySelector('#stls-reset').addEventListener('click', async () => {
        const confirmed = confirm('정말로 모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다!');
        if (confirmed) {
            storage.settings.chatData = {};
            storage.settings.characterData = {};
            storage.settings.globalData = {};
            storage.save();
            showSuccess('모든 데이터가 삭제되었습니다.');
        }
    });
    
    return container;
}

export default {
    showSettings
};
