/**
 * ST-LifeSim 이모티콘 모듈 (Emoticon)
 * 커스텀 이모티콘 등록, 관리, 전송 기능
 * 
 * 기능:
 * 1. 이모티콘 추가/편집/삭제
 * 2. 카테고리별 분류
 * 3. 즐겨찾기 시스템
 * 4. 검색 기능
 * 5. AI 사용 가능/불가 구분
 * 6. 팝업창 UI
 */

import { saveData, loadData } from '../../utils/storage.js';
import { createTabbedPopup, showConfirmDialog, showInputDialog, closePopup } from '../../utils/popup.js';
import { sendEmoticon } from '../../utils/slash.js';
import { showToast, createSearchInput, createEmptyState } from '../../utils/ui.js';

// 이모티콘 데이터 저장소
let emoticons = [];
let currentBinding = 'chat'; // 'chat' 또는 'character'

/**
 * 이모티콘 모듈 초기화
 */
export async function initializeEmoticon() {
    console.log('[ST-LifeSim Emoticon] Initializing...');
    
    // CSS 로드
    loadEmoticonCSS();
    
    // 저장된 이모티콘 불러오기
    const savedData = loadData('emoticons', currentBinding, null);
    if (savedData) {
        emoticons = savedData.emoticons || [];
        currentBinding = savedData.binding || 'chat';
    } else {
        // 기본 이모티콘 추가
        emoticons = getDefaultEmoticons();
        saveEmoticonData();
    }
    
    // 툴바에 이모티콘 버튼 추가
    addEmoticonButton();
    
    // 전역 객체에 노출 (컨텍스트 주입용)
    window.lifesimEmoticon = {
        getAIUsableEmoticons
    };
    
    console.log('[ST-LifeSim Emoticon] Initialized successfully');
}

/**
 * 툴바에 이모티콘 버튼 추가
 */
function addEmoticonButton() {
    // Quick Tools 툴바 찾기
    const toolbar = document.getElementById('lifesim-quick-toolbar');
    if (!toolbar) {
        // 툴바가 없으면 새로 생성하거나 채팅 영역에 추가
        console.warn('[ST-LifeSim Emoticon] Quick Tools toolbar not found, creating standalone button');
        createStandaloneButton();
        return;
    }
    
    // 이모티콘 버튼 추가
    const section = toolbar.querySelector('.lifesim-toolbar-section');
    if (section) {
        const button = document.createElement('button');
        button.id = 'lifesim-emoticon-btn';
        button.className = 'lifesim-toolbar-btn';
        button.title = '이모티콘';
        button.innerHTML = '😊 이모티콘';
        button.onclick = openEmoticonPopup;
        
        section.appendChild(button);
    }
}

/**
 * 독립 버튼 생성 (툴바가 없을 경우)
 */
function createStandaloneButton() {
    const chatInput = document.getElementById('send_textarea') || document.querySelector('.mes_block');
    if (!chatInput) return;
    
    const button = document.createElement('button');
    button.id = 'lifesim-emoticon-standalone-btn';
    button.className = 'lifesim-toolbar-btn';
    button.style.margin = '10px';
    button.innerHTML = '😊 이모티콘';
    button.onclick = openEmoticonPopup;
    
    chatInput.parentNode.insertBefore(button, chatInput);
}

/**
 * 이모티콘 팝업 열기
 */
function openEmoticonPopup() {
    const categories = getCategories();
    const tabs = [];
    
    // 전체 탭
    tabs.push({
        id: 'all',
        label: '전체',
        content: createEmoticonGrid('all')
    });
    
    // 즐겨찾기 탭
    tabs.push({
        id: 'favorite',
        label: '⭐ 즐겨찾기',
        content: createEmoticonGrid('favorite')
    });
    
    // 카테고리 탭들
    categories.forEach(category => {
        tabs.push({
            id: category,
            label: category,
            content: createEmoticonGrid(category)
        });
    });
    
    createTabbedPopup({
        title: '😊 이모티콘',
        tabs: tabs,
        defaultTab: 'all',
        width: '700px'
    });
    
    // 검색 및 하단 버튼 추가
    enhanceEmoticonPopup();
}

/**
 * 이모티콘 그리드 생성
 */
function createEmoticonGrid(filter) {
    const container = document.createElement('div');
    container.className = 'lifesim-emoticon-container';
    
    // 검색 영역
    const searchContainer = createSearchInput('이모티콘 검색...', (query) => {
        filterEmoticons(container, filter, query);
    });
    container.appendChild(searchContainer);
    
    // 그리드 영역
    const grid = document.createElement('div');
    grid.className = 'lifesim-emoticon-grid';
    grid.id = `emoticon-grid-${filter}`;
    
    const filteredEmoticons = getFilteredEmoticons(filter);
    
    if (filteredEmoticons.length === 0) {
        grid.appendChild(createEmptyState('이모티콘이 없습니다.', '😕'));
    } else {
        filteredEmoticons.forEach(emoticon => {
            const item = createEmoticonItem(emoticon);
            grid.appendChild(item);
        });
    }
    
    container.appendChild(grid);
    
    // 하단 버튼
    const footer = document.createElement('div');
    footer.className = 'lifesim-emoticon-footer';
    footer.innerHTML = `
        <button class="lifesim-btn" id="emoticon-add-btn">+ 이모티콘 추가</button>
        <button class="lifesim-btn" id="emoticon-manage-btn">관리</button>
        <div style="flex: 1;"></div>
        <label style="font-size: 13px; color: #999;">
            저장 방식:
            <select id="emoticon-binding-select" class="lifesim-select" style="width: auto; display: inline-block; margin-left: 5px;">
                <option value="chat" ${currentBinding === 'chat' ? 'selected' : ''}>이 채팅</option>
                <option value="character" ${currentBinding === 'character' ? 'selected' : ''}>이 캐릭터</option>
            </select>
        </label>
    `;
    container.appendChild(footer);
    
    // 이벤트 리스너
    setTimeout(() => {
        document.getElementById('emoticon-add-btn')?.addEventListener('click', () => showAddEmoticonDialog());
        document.getElementById('emoticon-manage-btn')?.addEventListener('click', () => showManageDialog());
        document.getElementById('emoticon-binding-select')?.addEventListener('change', (e) => {
            changeBinding(e.target.value);
        });
    }, 100);
    
    return container;
}

/**
 * 이모티콘 아이템 생성
 */
function createEmoticonItem(emoticon) {
    const item = document.createElement('div');
    item.className = 'lifesim-emoticon-item';
    item.dataset.id = emoticon.id;
    
    // AI 전용 표시
    const lockIcon = emoticon.aiUsable ? '' : '<span class="lifesim-lock-icon">🔒</span>';
    
    // 즐겨찾기 표시
    const favoriteIcon = emoticon.favorite ? '<span class="lifesim-favorite-icon">⭐</span>' : '';
    
    item.innerHTML = `
        <div class="lifesim-emoticon-image">
            <img src="${emoticon.url}" alt="${emoticon.name}" loading="lazy">
            ${lockIcon}
            ${favoriteIcon}
        </div>
        <div class="lifesim-emoticon-name">${emoticon.name}</div>
    `;
    
    // 클릭 이벤트: 이모티콘 전송
    item.addEventListener('click', () => {
        sendEmoticonMessage(emoticon);
    });
    
    // 우클릭 이벤트: 편집 메뉴
    item.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showEmoticonContextMenu(emoticon, e.clientX, e.clientY);
    });
    
    return item;
}

/**
 * 이모티콘 전송
 */
async function sendEmoticonMessage(emoticon) {
    await sendEmoticon(emoticon.name, emoticon.url);
    closePopup();
    showToast(`"${emoticon.name}" 이모티콘 전송 완료`, 'success');
}

/**
 * 필터링된 이모티콘 목록 가져오기
 */
function getFilteredEmoticons(filter) {
    if (filter === 'all') {
        return emoticons;
    } else if (filter === 'favorite') {
        return emoticons.filter(e => e.favorite);
    } else {
        return emoticons.filter(e => e.category === filter);
    }
}

/**
 * 검색으로 이모티콘 필터링
 */
function filterEmoticons(container, category, query) {
    const grid = container.querySelector('.lifesim-emoticon-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    const filtered = getFilteredEmoticons(category).filter(e => 
        e.name.toLowerCase().includes(query.toLowerCase())
    );
    
    if (filtered.length === 0) {
        grid.appendChild(createEmptyState('검색 결과가 없습니다.', '🔍'));
    } else {
        filtered.forEach(emoticon => {
            grid.appendChild(createEmoticonItem(emoticon));
        });
    }
}

/**
 * 카테고리 목록 가져오기
 */
function getCategories() {
    const categories = new Set();
    emoticons.forEach(e => {
        if (e.category) {
            categories.add(e.category);
        }
    });
    return Array.from(categories);
}

/**
 * 이모티콘 추가 다이얼로그
 */
async function showAddEmoticonDialog(existingEmoticon = null) {
    const isEdit = existingEmoticon !== null;
    const emoticon = existingEmoticon || {
        name: '',
        url: '',
        category: '기본',
        aiUsable: true,
        favorite: false
    };
    
    const dialogHtml = `
        <div class="lifesim-form-group">
            <label class="lifesim-form-label required">이름:</label>
            <input type="text" id="emoticon-name" class="lifesim-input" value="${emoticon.name}" placeholder="하트">
        </div>
        
        <div class="lifesim-form-group">
            <label class="lifesim-form-label required">URL:</label>
            <input type="text" id="emoticon-url" class="lifesim-input" value="${emoticon.url}" placeholder="https://example.com/heart.gif">
        </div>
        
        <div class="lifesim-form-group">
            <label class="lifesim-form-label">카테고리:</label>
            <input type="text" id="emoticon-category" class="lifesim-input" value="${emoticon.category}" placeholder="기본">
        </div>
        
        <div class="lifesim-form-group">
            <label class="lifesim-form-label">AI 사용:</label>
            <div>
                <label style="margin-right: 15px;">
                    <input type="radio" name="ai-usable" value="true" ${emoticon.aiUsable ? 'checked' : ''}> 가능
                </label>
                <label>
                    <input type="radio" name="ai-usable" value="false" ${!emoticon.aiUsable ? 'checked' : ''}> 불가 (유저 전용)
                </label>
            </div>
        </div>
        
        <div class="lifesim-form-group">
            <label class="lifesim-form-label">미리보기:</label>
            <div id="emoticon-preview" class="lifesim-emoticon-preview">
                ${emoticon.url ? `<img src="${emoticon.url}" alt="미리보기">` : '<span style="color: #999;">URL을 입력하세요</span>'}
            </div>
        </div>
    `;
    
    // Import popup module dynamically
    const popupModule = await import('../../utils/popup.js');
    const { createPopup } = popupModule;
    
    createPopup({
        title: isEdit ? '이모티콘 편집' : '이모티콘 추가',
        content: dialogHtml,
        width: '500px',
        buttons: [
            {
                text: '취소',
                className: ''
            },
            {
                text: isEdit ? '수정' : '저장',
                className: 'lifesim-btn-primary',
                onClick: () => {
                    const name = document.getElementById('emoticon-name').value.trim();
                    const url = document.getElementById('emoticon-url').value.trim();
                    const category = document.getElementById('emoticon-category').value.trim() || '기본';
                    const aiUsable = document.querySelector('input[name="ai-usable"]:checked').value === 'true';
                    
                    if (!name || !url) {
                        showToast('이름과 URL은 필수 입력 항목입니다.', 'error');
                        return;
                    }
                    
                    if (isEdit) {
                        updateEmoticon(emoticon.id, { name, url, category, aiUsable });
                    } else {
                        addEmoticon({ name, url, category, aiUsable, favorite: false });
                    }
                }
            }
        ]
    });
    
    // URL 입력 시 미리보기 업데이트
    setTimeout(() => {
        document.getElementById('emoticon-url')?.addEventListener('input', (e) => {
            const preview = document.getElementById('emoticon-preview');
            const url = e.target.value.trim();
            if (url) {
                preview.innerHTML = `<img src="${url}" alt="미리보기" onerror="this.parentElement.innerHTML='<span style=&quot;color: #f00;&quot;>이미지를 불러올 수 없습니다</span>'">`;
            } else {
                preview.innerHTML = '<span style="color: #999;">URL을 입력하세요</span>';
            }
        });
    }, 100);
}

/**
 * 이모티콘 추가
 */
function addEmoticon(emoticonData) {
    const newEmoticon = {
        id: generateId(),
        ...emoticonData
    };
    
    emoticons.push(newEmoticon);
    saveEmoticonData();
    
    showToast('이모티콘이 추가되었습니다.', 'success');
    closePopup();
    
    // 팝업 재열람
    setTimeout(() => openEmoticonPopup(), 300);
}

/**
 * 이모티콘 업데이트
 */
function updateEmoticon(id, updates) {
    const index = emoticons.findIndex(e => e.id === id);
    if (index !== -1) {
        emoticons[index] = { ...emoticons[index], ...updates };
        saveEmoticonData();
        showToast('이모티콘이 수정되었습니다.', 'success');
        closePopup();
        setTimeout(() => openEmoticonPopup(), 300);
    }
}

/**
 * 이모티콘 삭제
 */
function deleteEmoticon(id) {
    showConfirmDialog('이 이모티콘을 삭제하시겠습니까?', () => {
        emoticons = emoticons.filter(e => e.id !== id);
        saveEmoticonData();
        showToast('이모티콘이 삭제되었습니다.', 'success');
        closePopup();
        setTimeout(() => openEmoticonPopup(), 300);
    });
}

/**
 * 즐겨찾기 토글
 */
function toggleFavorite(id) {
    const emoticon = emoticons.find(e => e.id === id);
    if (emoticon) {
        emoticon.favorite = !emoticon.favorite;
        saveEmoticonData();
        // UI 업데이트
        const item = document.querySelector(`.lifesim-emoticon-item[data-id="${id}"]`);
        if (item) {
            const favoriteIcon = item.querySelector('.lifesim-favorite-icon');
            if (emoticon.favorite && !favoriteIcon) {
                item.querySelector('.lifesim-emoticon-image').innerHTML += '<span class="lifesim-favorite-icon">⭐</span>';
            } else if (!emoticon.favorite && favoriteIcon) {
                favoriteIcon.remove();
            }
        }
    }
}

/**
 * 컨텍스트 메뉴 표시
 */
function showEmoticonContextMenu(emoticon, x, y) {
    // 기존 메뉴 제거
    document.querySelectorAll('.lifesim-context-menu').forEach(m => m.remove());
    
    const menu = document.createElement('div');
    menu.className = 'lifesim-context-menu';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.innerHTML = `
        <button data-action="favorite">${emoticon.favorite ? '⭐ 즐겨찾기 해제' : '☆ 즐겨찾기 추가'}</button>
        <button data-action="edit">✏️ 편집</button>
        <button data-action="delete" style="color: #dc3545;">🗑️ 삭제</button>
    `;
    
    document.body.appendChild(menu);
    
    // 이벤트 리스너
    menu.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            if (action === 'favorite') {
                toggleFavorite(emoticon.id);
            } else if (action === 'edit') {
                showAddEmoticonDialog(emoticon);
            } else if (action === 'delete') {
                deleteEmoticon(emoticon.id);
            }
            menu.remove();
        });
    });
    
    // 외부 클릭 시 닫기
    setTimeout(() => {
        document.addEventListener('click', () => menu.remove(), { once: true });
    }, 100);
}

/**
 * 관리 다이얼로그
 */
function showManageDialog() {
    // 간단한 관리 옵션
    showToast('관리 기능은 우클릭 메뉴를 사용하세요', 'info');
}

/**
 * 바인딩 변경
 */
function changeBinding(newBinding) {
    if (newBinding === currentBinding) return;
    
    showConfirmDialog(
        `저장 방식을 변경하시겠습니까?\n현재: ${currentBinding === 'chat' ? '이 채팅' : '이 캐릭터'}\n→ ${newBinding === 'chat' ? '이 채팅' : '이 캐릭터'}`,
        () => {
            currentBinding = newBinding;
            // 데이터 재로드
            const savedData = loadData('emoticons', currentBinding, null);
            if (savedData) {
                emoticons = savedData.emoticons || [];
            } else {
                emoticons = [];
            }
            saveEmoticonData();
            showToast('저장 방식이 변경되었습니다.', 'success');
            closePopup();
            setTimeout(() => openEmoticonPopup(), 300);
        }
    );
}

/**
 * 이모티콘 데이터 저장
 */
function saveEmoticonData() {
    saveData('emoticons', { emoticons, binding: currentBinding }, currentBinding);
}

/**
 * 기본 이모티콘 목록
 */
function getDefaultEmoticons() {
    return [
        {
            id: generateId(),
            name: '하트',
            url: 'https://em-content.zobj.net/source/animated-noto-color-emoji/356/red-heart_2764-fe0f.gif',
            category: '기본',
            aiUsable: true,
            favorite: false
        },
        {
            id: generateId(),
            name: '웃음',
            url: 'https://em-content.zobj.net/source/animated-noto-color-emoji/356/grinning-face-with-smiling-eyes_1f604.gif',
            category: '기본',
            aiUsable: true,
            favorite: false
        }
    ];
}

/**
 * CSS 로드
 */
function loadEmoticonCSS() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'scripts/extensions/st-lifesim/modules/emoticon/emoticon.css';
    document.head.appendChild(link);
}

/**
 * 팝업 개선 (헬퍼 함수)
 */
function enhanceEmoticonPopup() {
    // 추가 기능이 필요할 경우 여기에 구현
}

/**
 * ID 생성
 */
function generateId() {
    return 'emoticon_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
}

/**
 * AI 사용 가능 이모티콘 목록 (컨텍스트 주입용)
 */
export function getAIUsableEmoticons() {
    return emoticons.filter(e => e.aiUsable);
}
