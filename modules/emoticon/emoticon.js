/* ============================================================================
 * emoticon.js - 이모티콘 모듈
 * ============================================================================
 * 이미지 기반 이모티콘 등록 및 전송
 * - URL로 이모티콘 등록
 * - 카테고리별 분류
 * - 즐겨찾기 지원
 * - AI 사용 가능/불가 구분
 * - 검색 기능
 * ========================================================================== */

import { storage } from '../../utils/storage.js';
import { send } from '../../utils/slash.js';
import { createPopup, confirm } from '../../utils/popup.js';
import { showSuccess, showError, createElement, createTabs } from '../../utils/ui.js';
import { contextInjector, formatSection } from '../../utils/context-inject.js';

let emoticons = [];
let popupInstance = null;

/**
 * 모듈 초기화
 */
export async function init() {
    console.log('[Emoticon] 모듈 초기화...');
    
    // CSS 로드
    loadCSS();
    
    // 데이터 로드
    loadEmoticons();
    
    // 툴바 버튼 추가
    addToolbarButton();
    
    // 컨텍스트 주입 등록
    contextInjector.register('emoticon', generateContext);
    
    console.log('[Emoticon] 모듈 초기화 완료');
}

/**
 * 모듈 정리
 */
export function cleanup() {
    contextInjector.unregister('emoticon');
    
    const btn = document.querySelector('#stls-emoticon-btn');
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
    link.href = new URL('./emoticon.css', import.meta.url).href;
    document.head.appendChild(link);
}

/**
 * 툴바 버튼 추가
 */
function addToolbarButton() {
    const toolbar = document.querySelector('#stls-quick-toolbar');
    if (!toolbar) {
        console.warn('[Emoticon] 퀵 툴바를 찾을 수 없습니다.');
        return;
    }
    
    const btn = createElement('button', {
        id: 'stls-emoticon-btn',
        className: 'stls-toolbar-btn',
        onClick: showEmoticonPopup
    }, '😊 이모티콘');
    
    toolbar.appendChild(btn);
}

/**
 * 이모티콘 팝업 표시
 */
function showEmoticonPopup() {
    // 카테고리 추출
    const categories = ['전체', '즐겨찾기', ...new Set(emoticons.map(e => e.category).filter(Boolean))];
    
    let currentCategory = '전체';
    let searchQuery = '';
    
    function renderContent() {
        const container = createElement('div');
        
        // 탭
        const tabs = createElement('div', { className: 'stls-tabs' });
        categories.forEach(cat => {
            const tab = createElement('button', {
                className: `stls-tab ${cat === currentCategory ? 'active' : ''}`,
                onClick: () => {
                    currentCategory = cat;
                    updateContent();
                }
            }, cat);
            tabs.appendChild(tab);
        });
        
        // 검색창
        const searchInput = createElement('input', {
            type: 'text',
            className: 'stls-input stls-emoticon-search',
            placeholder: '🔍 이모티콘 검색...',
            value: searchQuery,
            onInput: (e) => {
                searchQuery = e.target.value;
                updateContent();
            }
        });
        
        // 그리드
        const grid = createElement('div', {
            className: 'stls-emoticon-grid',
            id: 'emoticon-grid'
        });
        
        container.appendChild(tabs);
        container.appendChild(searchInput);
        container.appendChild(grid);
        
        updateGrid();
        
        return container;
    }
    
    function updateContent() {
        const grid = document.getElementById('emoticon-grid');
        if (grid) {
            grid.innerHTML = '';
            updateGrid();
        }
    }
    
    function updateGrid() {
        const grid = document.getElementById('emoticon-grid');
        if (!grid) return;
        
        // 필터링
        let filtered = emoticons;
        
        if (currentCategory === '즐겨찾기') {
            filtered = filtered.filter(e => e.favorite);
        } else if (currentCategory !== '전체') {
            filtered = filtered.filter(e => e.category === currentCategory);
        }
        
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(e => 
                e.name.toLowerCase().includes(query) ||
                e.category?.toLowerCase().includes(query)
            );
        }
        
        // 렌더링
        if (filtered.length === 0) {
            grid.innerHTML = '<div class="stls-emoticon-empty">이모티콘이 없습니다.</div>';
            return;
        }
        
        filtered.forEach(emoticon => {
            const item = createElement('div', {
                className: `stls-emoticon-item ${emoticon.favorite ? 'favorite' : ''}`,
                onClick: () => sendEmoticon(emoticon)
            });
            
            item.innerHTML = `
                ${!emoticon.aiUsable ? '<span class="stls-emoticon-lock">🔒</span>' : ''}
                <span class="stls-emoticon-favorite" data-id="${emoticon.id}">
                    ${emoticon.favorite ? '⭐' : '☆'}
                </span>
                <img src="${emoticon.url}" class="stls-emoticon-image" alt="${emoticon.name}" />
                <div class="stls-emoticon-name">${emoticon.name}</div>
                <div class="stls-emoticon-actions">
                    <button class="stls-emoticon-action-btn edit-btn" data-id="${emoticon.id}">✏️</button>
                    <button class="stls-emoticon-action-btn delete-btn" data-id="${emoticon.id}">🗑️</button>
                </div>
            `;
            
            // 즐겨찾기 토글
            const favBtn = item.querySelector('.stls-emoticon-favorite');
            favBtn.onclick = (e) => {
                e.stopPropagation();
                toggleFavorite(emoticon.id);
                updateContent();
            };
            
            // 편집 버튼
            const editBtn = item.querySelector('.edit-btn');
            editBtn.onclick = (e) => {
                e.stopPropagation();
                editEmoticon(emoticon.id);
            };
            
            // 삭제 버튼
            const deleteBtn = item.querySelector('.delete-btn');
            deleteBtn.onclick = async (e) => {
                e.stopPropagation();
                const confirmed = await confirm(`"${emoticon.name}" 이모티콘을 삭제하시겠습니까?`);
                if (confirmed) {
                    deleteEmoticon(emoticon.id);
                    updateContent();
                }
            };
            
            grid.appendChild(item);
        });
    }
    
    const content = renderContent();
    
    popupInstance = createPopup({
        title: '😊 이모티콘',
        content,
        buttons: [
            {
                text: '+ 이모티콘 추가',
                className: 'stls-btn-primary',
                onClick: () => showAddEmoticonForm(),
                closeOnClick: false
            },
            {
                text: '닫기',
                className: 'stls-btn-secondary'
            }
        ],
        width: '700px',
        height: '600px',
        onClose: () => {
            popupInstance = null;
        }
    });
}

/**
 * 이모티콘 추가/편집 폼
 */
function showAddEmoticonForm(editId = null) {
    const editing = editId ? emoticons.find(e => e.id === editId) : null;
    
    const form = createElement('div', { className: 'stls-emoticon-form' });
    
    form.innerHTML = `
        <div class="stls-form-group">
            <label class="stls-label">이름 *</label>
            <input type="text" class="stls-input" id="emo-name" value="${editing?.name || ''}" placeholder="예: 하트" />
        </div>
        
        <div class="stls-form-group">
            <label class="stls-label">이미지 URL *</label>
            <input type="text" class="stls-input" id="emo-url" value="${editing?.url || ''}" placeholder="https://example.com/image.gif" />
        </div>
        
        <div class="stls-form-group">
            <label class="stls-label">카테고리</label>
            <input type="text" class="stls-input" id="emo-category" value="${editing?.category || '기본'}" placeholder="기본" />
        </div>
        
        <div class="stls-form-group">
            <label class="stls-label">AI 사용</label>
            <label style="display: flex; gap: 16px;">
                <input type="radio" name="ai-usable" value="true" ${!editing || editing.aiUsable ? 'checked' : ''} /> 가능
                <input type="radio" name="ai-usable" value="false" ${editing && !editing.aiUsable ? 'checked' : ''} /> 불가 (유저 전용)
            </label>
        </div>
        
        <div class="stls-form-group">
            <label class="stls-label">미리보기</label>
            <div class="stls-emoticon-preview" id="emo-preview">
                ${editing ? `<img src="${editing.url}" />` : '<span class="stls-text-muted">URL을 입력하면 미리보기가 표시됩니다</span>'}
            </div>
        </div>
    `;
    
    // URL 입력 시 미리보기 업데이트
    setTimeout(() => {
        const urlInput = form.querySelector('#emo-url');
        urlInput.addEventListener('input', (e) => {
            const preview = form.querySelector('#emo-preview');
            const url = e.target.value.trim();
            if (url) {
                preview.innerHTML = `<img src="${url}" onerror="this.parentElement.innerHTML='<span class=\\'stls-text-muted\\'>이미지를 불러올 수 없습니다</span>'" />`;
            } else {
                preview.innerHTML = '<span class="stls-text-muted">URL을 입력하면 미리보기가 표시됩니다</span>';
            }
        });
    }, 100);
    
    const popup = createPopup({
        title: editing ? '이모티콘 편집' : '이모티콘 추가',
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
                    const name = form.querySelector('#emo-name').value.trim();
                    const url = form.querySelector('#emo-url').value.trim();
                    const category = form.querySelector('#emo-category').value.trim() || '기본';
                    const aiUsable = form.querySelector('input[name="ai-usable"]:checked').value === 'true';
                    
                    if (!name || !url) {
                        showError('이름과 URL은 필수입니다.');
                        return;
                    }
                    
                    if (editing) {
                        // 수정
                        Object.assign(editing, { name, url, category, aiUsable });
                    } else {
                        // 추가
                        emoticons.push({
                            id: Date.now().toString(),
                            name,
                            url,
                            category,
                            aiUsable,
                            favorite: false
                        });
                    }
                    
                    saveEmoticons();
                    showSuccess(editing ? '이모티콘을 수정했습니다.' : '이모티콘을 추가했습니다.');
                    
                    // 메인 팝업 업데이트
                    if (popupInstance) {
                        showEmoticonPopup();
                    }
                }
            }
        ],
        width: '500px'
    });
}

/**
 * 이모티콘 전송
 */
async function sendEmoticon(emoticon) {
    try {
        await send(`![${emoticon.name}](${emoticon.url})`);
        showSuccess(`${emoticon.name} 이모티콘을 전송했습니다.`);
        
        if (popupInstance) {
            popupInstance.close();
        }
    } catch (error) {
        showError('이모티콘 전송 실패: ' + error.message);
    }
}

/**
 * 즐겨찾기 토글
 */
function toggleFavorite(id) {
    const emoticon = emoticons.find(e => e.id === id);
    if (emoticon) {
        emoticon.favorite = !emoticon.favorite;
        saveEmoticons();
    }
}

/**
 * 이모티콘 편집
 */
function editEmoticon(id) {
    showAddEmoticonForm(id);
}

/**
 * 이모티콘 삭제
 */
function deleteEmoticon(id) {
    emoticons = emoticons.filter(e => e.id !== id);
    saveEmoticons();
    showSuccess('이모티콘을 삭제했습니다.');
}

/**
 * 이모티콘 로드
 */
function loadEmoticons() {
    emoticons = storage.getData('emoticon', 'list', [], 'global');
}

/**
 * 이모티콘 저장
 */
function saveEmoticons() {
    storage.setData('emoticon', 'list', emoticons, 'global');
}

/**
 * 컨텍스트 생성
 */
function generateContext() {
    const aiUsableEmoticons = emoticons.filter(e => e.aiUsable);
    
    if (aiUsableEmoticons.length === 0) {
        return '';
    }
    
    const items = aiUsableEmoticons.map(e => 
        `${e.name}: ![${e.name}](${e.url})`
    );
    
    return formatSection('AI 사용 가능 이모티콘', items);
}

/**
 * 이모티콘 팝업 표시 (외부에서 호출 가능)
 */
export function showEmoticonPanel() {
    showEmoticonPopup();
}

export default {
    init,
    cleanup,
    showEmoticonPanel
};
