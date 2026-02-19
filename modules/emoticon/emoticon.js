/* ===========================================
   emoticon.js - 이모티콘 모듈
   =========================================== */

(function() {
    'use strict';
    
    // 이모티콘 데이터
    let emoticons = [];
    let categories = ['기본', '감정', '동작', '기타'];
    let currentCategory = '전체';
    let searchQuery = '';
    
    /**
     * 초기화
     */
    function initialize() {
        console.log('[ST-LifeSim] Emoticon 모듈 로딩...');
        
        // 저장된 이모티콘 불러오기
        loadEmoticons();
        
        // 툴바에 버튼 추가
        addToolbarButton();
        
        console.log('[ST-LifeSim] Emoticon 모듈 로드 완료');
    }
    
    /**
     * 이모티콘 불러오기
     */
    function loadEmoticons() {
        const storage = window.STLifeSimStorage;
        if (storage) {
            emoticons = storage.loadData('emoticons', [], storage.STORAGE_TYPE.CHARACTER);
            const savedCategories = storage.loadData('emoticonCategories', null, storage.STORAGE_TYPE.CHARACTER);
            if (savedCategories) {
                categories = savedCategories;
            }
        }
    }
    
    /**
     * 이모티콘 저장
     */
    function saveEmoticons() {
        const storage = window.STLifeSimStorage;
        if (storage) {
            storage.saveData('emoticons', emoticons, storage.STORAGE_TYPE.CHARACTER);
            storage.saveData('emoticonCategories', categories, storage.STORAGE_TYPE.CHARACTER);
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
        btn.textContent = '😊 이모티콘';
        btn.addEventListener('click', showEmoticonPanel);
        toolbar.appendChild(btn);
    }
    
    /**
     * 이모티콘 패널 표시
     */
    function showEmoticonPanel() {
        const content = createEmoticonPanel();
        
        window.STLifeSimPopup?.createPopup?.({
            title: '😊 이모티콘',
            content: content,
            width: '700px',
            height: '600px'
        });
    }
    
    /**
     * 이모티콘 패널 생성
     */
    function createEmoticonPanel() {
        const container = document.createElement('div');
        
        // 탭 생성
        const tabs = [
            { id: '전체', label: '전체', content: '' },
            { id: '즐겨찾기', label: '즐겨찾기', content: '' },
            ...categories.map(cat => ({ id: cat, label: cat, content: '' }))
        ];
        
        const tabContainer = window.STLifeSimUI?.createTabs?.(tabs, currentCategory) || document.createElement('div');
        
        // 검색창
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'stls-input stls-emoticon-search';
        searchInput.placeholder = '🔍 이모티콘 검색...';
        searchInput.value = searchQuery;
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderEmoticonGrid(container);
        });
        
        container.appendChild(tabContainer);
        container.appendChild(searchInput);
        
        // 이모티콘 그리드
        const gridContainer = document.createElement('div');
        gridContainer.id = 'stls-emoticon-grid-container';
        container.appendChild(gridContainer);
        
        // 하단 액션 버튼
        const actions = document.createElement('div');
        actions.className = 'stls-emoticon-actions';
        
        const addBtn = document.createElement('button');
        addBtn.className = 'stls-btn stls-btn-primary';
        addBtn.textContent = '+ 이모티콘 추가';
        addBtn.addEventListener('click', () => showAddEmoticonDialog());
        
        const manageBtn = document.createElement('button');
        manageBtn.className = 'stls-btn';
        manageBtn.textContent = '관리';
        manageBtn.addEventListener('click', () => showManageDialog());
        
        actions.appendChild(addBtn);
        actions.appendChild(manageBtn);
        container.appendChild(actions);
        
        // 탭 클릭 이벤트
        tabContainer.querySelectorAll('.stls-tab').forEach((tab, index) => {
            tab.addEventListener('click', () => {
                currentCategory = tabs[index].id;
                renderEmoticonGrid(container);
            });
        });
        
        // 초기 렌더링
        renderEmoticonGrid(container);
        
        return container;
    }
    
    /**
     * 이모티콘 그리드 렌더링
     */
    function renderEmoticonGrid(container) {
        const gridContainer = container.querySelector('#stls-emoticon-grid-container');
        if (!gridContainer) return;
        
        // 필터링
        let filtered = emoticons;
        
        if (currentCategory === '즐겨찾기') {
            filtered = emoticons.filter(e => e.favorite);
        } else if (currentCategory !== '전체') {
            filtered = emoticons.filter(e => e.category === currentCategory);
        }
        
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(e => e.name.toLowerCase().includes(query));
        }
        
        // 그리드 생성
        const grid = document.createElement('div');
        grid.className = 'stls-emoticon-grid';
        
        if (filtered.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: #888;">이모티콘이 없습니다.</p>';
        } else {
            filtered.forEach(emoticon => {
                const item = createEmoticonItem(emoticon);
                grid.appendChild(item);
            });
        }
        
        gridContainer.innerHTML = '';
        gridContainer.appendChild(grid);
    }
    
    /**
     * 이모티콘 아이템 생성
     */
    function createEmoticonItem(emoticon) {
        const item = document.createElement('div');
        item.className = 'stls-emoticon-item';
        
        if (!emoticon.aiUsable) {
            item.classList.add('locked');
        }
        if (emoticon.favorite) {
            item.classList.add('favorite');
        }
        
        const img = document.createElement('img');
        img.className = 'stls-emoticon-img';
        img.src = emoticon.url;
        img.alt = emoticon.name;
        img.onerror = () => {
            img.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="40">❌</text></svg>';
        };
        
        const name = document.createElement('div');
        name.className = 'stls-emoticon-name';
        name.textContent = emoticon.name;
        
        item.appendChild(img);
        item.appendChild(name);
        
        // 클릭 이벤트: 이모티콘 전송
        item.addEventListener('click', () => {
            sendEmoticon(emoticon);
        });
        
        // 우클릭: 옵션 메뉴
        item.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showEmoticonContextMenu(emoticon, e.target);
        });
        
        return item;
    }
    
    /**
     * 이모티콘 전송
     */
    async function sendEmoticon(emoticon) {
        const markdown = `![${emoticon.name}](${emoticon.url})`;
        await window.STLifeSimSlash?.sendMessage?.(markdown);
        window.STLifeSimUI?.showSuccess?.(`${emoticon.name} 전송 완료`);
    }
    
    /**
     * 이모티콘 컨텍스트 메뉴
     */
    function showEmoticonContextMenu(emoticon, anchorEl) {
        const items = [
            {
                text: emoticon.favorite ? '⭐ 즐겨찾기 해제' : '☆ 즐겨찾기 추가',
                onClick: () => {
                    emoticon.favorite = !emoticon.favorite;
                    saveEmoticons();
                    showEmoticonPanel(); // 패널 새로고침
                }
            },
            {
                text: '✏️ 편집',
                onClick: () => showEditEmoticonDialog(emoticon)
            },
            {
                text: '🗑️ 삭제',
                onClick: () => {
                    window.STLifeSimPopup?.showConfirm?.(
                        `"${emoticon.name}" 이모티콘을 삭제하시겠습니까?`,
                        () => {
                            emoticons = emoticons.filter(e => e.id !== emoticon.id);
                            saveEmoticons();
                            showEmoticonPanel(); // 패널 새로고침
                            window.STLifeSimUI?.showSuccess?.('이모티콘을 삭제했습니다.');
                        }
                    );
                }
            }
        ];
        
        window.STLifeSimUI?.createDropdown?.(items, anchorEl);
    }
    
    /**
     * 이모티콘 추가 다이얼로그
     */
    function showAddEmoticonDialog() {
        showEmoticonDialog(null);
    }
    
    /**
     * 이모티콘 편집 다이얼로그
     */
    function showEditEmoticonDialog(emoticon) {
        showEmoticonDialog(emoticon);
    }
    
    /**
     * 이모티콘 추가/편집 다이얼로그
     */
    function showEmoticonDialog(emoticon = null) {
        const isEdit = emoticon !== null;
        
        const content = document.createElement('div');
        content.innerHTML = `
            <div class="stls-form-group">
                <label class="stls-form-label">이름 *</label>
                <input type="text" class="stls-input" id="stls-emo-name" value="${emoticon?.name || ''}" required>
            </div>
            <div class="stls-form-group">
                <label class="stls-form-label">URL *</label>
                <input type="text" class="stls-input" id="stls-emo-url" value="${emoticon?.url || ''}" required>
            </div>
            <div class="stls-form-group">
                <label class="stls-form-label">카테고리</label>
                <select class="stls-select" id="stls-emo-category">
                    ${categories.map(cat => `<option value="${cat}" ${emoticon?.category === cat ? 'selected' : ''}>${cat}</option>`).join('')}
                </select>
            </div>
            <div class="stls-form-group">
                <label class="stls-form-label">AI 사용</label>
                <div>
                    <label><input type="radio" name="aiUsable" value="true" ${emoticon?.aiUsable !== false ? 'checked' : ''}> 가능</label>
                    <label style="margin-left: 15px;"><input type="radio" name="aiUsable" value="false" ${emoticon?.aiUsable === false ? 'checked' : ''}> 불가</label>
                </div>
            </div>
            <div class="stls-form-group">
                <label class="stls-form-label">미리보기</label>
                <div style="text-align: center; padding: 20px; border: 1px solid var(--SmartThemeBorderColor, #333); border-radius: 4px;">
                    <img id="stls-emo-preview" src="${emoticon?.url || ''}" style="max-width: 100px; max-height: 100px; display: ${emoticon?.url ? 'block' : 'none'}; margin: 0 auto;" onerror="this.style.display='none'">
                    <p id="stls-emo-preview-text" style="color: #888; ${emoticon?.url ? 'display: none;' : ''}">URL을 입력하면 미리보기가 표시됩니다.</p>
                </div>
            </div>
        `;
        
        // URL 입력 시 미리보기 업데이트
        const urlInput = content.querySelector('#stls-emo-url');
        const preview = content.querySelector('#stls-emo-preview');
        const previewText = content.querySelector('#stls-emo-preview-text');
        
        urlInput.addEventListener('input', (e) => {
            const url = e.target.value.trim();
            if (url) {
                preview.src = url;
                preview.style.display = 'block';
                previewText.style.display = 'none';
            } else {
                preview.style.display = 'none';
                previewText.style.display = 'block';
            }
        });
        
        window.STLifeSimPopup?.createPopup?.({
            title: isEdit ? '이모티콘 편집' : '이모티콘 추가',
            content: content,
            buttons: [
                { text: '취소' },
                {
                    text: '저장',
                    primary: true,
                    onClick: () => {
                        const name = content.querySelector('#stls-emo-name').value.trim();
                        const url = content.querySelector('#stls-emo-url').value.trim();
                        const category = content.querySelector('#stls-emo-category').value;
                        const aiUsable = content.querySelector('input[name="aiUsable"]:checked').value === 'true';
                        
                        if (!name || !url) {
                            window.STLifeSimUI?.showError?.('이름과 URL을 입력해주세요.');
                            return;
                        }
                        
                        if (isEdit) {
                            // 편집
                            emoticon.name = name;
                            emoticon.url = url;
                            emoticon.category = category;
                            emoticon.aiUsable = aiUsable;
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
                        window.STLifeSimUI?.showSuccess?.(isEdit ? '이모티콘을 수정했습니다.' : '이모티콘을 추가했습니다.');
                        showEmoticonPanel(); // 패널 새로고침
                    }
                }
            ]
        });
    }
    
    /**
     * 관리 다이얼로그
     */
    function showManageDialog() {
        const content = document.createElement('div');
        
        let html = '<h4 style="margin-top: 0;">카테고리 관리</h4>';
        html += '<div>';
        
        categories.forEach((cat, index) => {
            html += `
                <div class="stls-emoticon-category-item">
                    <strong>${cat}</strong>
                    <div class="stls-emoticon-category-actions">
                        <button class="stls-btn" style="padding: 4px 8px; font-size: 12px;" data-edit-category="${index}">이름변경</button>
                        <button class="stls-btn" style="padding: 4px 8px; font-size: 12px;" data-delete-category="${index}">삭제</button>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        html += '<button class="stls-btn stls-btn-primary" id="stls-add-category" style="margin-top: 10px;">+ 카테고리 추가</button>';
        
        content.innerHTML = html;
        
        // 카테고리 추가
        content.querySelector('#stls-add-category').addEventListener('click', () => {
            window.STLifeSimPopup?.showPrompt?.('카테고리 이름을 입력하세요', '', (name) => {
                if (name && !categories.includes(name)) {
                    categories.push(name);
                    saveEmoticons();
                    showManageDialog();
                    window.STLifeSimUI?.showSuccess?.('카테고리를 추가했습니다.');
                }
            });
        });
        
        // 카테고리 편집
        content.querySelectorAll('[data-edit-category]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-edit-category'));
                const oldName = categories[index];
                
                window.STLifeSimPopup?.showPrompt?.('카테고리 이름을 입력하세요', oldName, (newName) => {
                    if (newName && newName !== oldName) {
                        // 이모티콘 카테고리도 업데이트
                        emoticons.forEach(emo => {
                            if (emo.category === oldName) {
                                emo.category = newName;
                            }
                        });
                        categories[index] = newName;
                        saveEmoticons();
                        showManageDialog();
                        window.STLifeSimUI?.showSuccess?.('카테고리를 수정했습니다.');
                    }
                });
            });
        });
        
        // 카테고리 삭제
        content.querySelectorAll('[data-delete-category]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-delete-category'));
                const catName = categories[index];
                
                window.STLifeSimPopup?.showConfirm?.(
                    `"${catName}" 카테고리를 삭제하시겠습니까? 해당 카테고리의 이모티콘은 "기타"로 이동됩니다.`,
                    () => {
                        // 이모티콘 카테고리 변경
                        emoticons.forEach(emo => {
                            if (emo.category === catName) {
                                emo.category = '기타';
                            }
                        });
                        categories.splice(index, 1);
                        saveEmoticons();
                        showManageDialog();
                        window.STLifeSimUI?.showSuccess?.('카테고리를 삭제했습니다.');
                    }
                );
            });
        });
        
        window.STLifeSimPopup?.createPopup?.({
            title: '이모티콘 관리',
            content: content,
            width: '500px',
            buttons: [
                { text: '닫기' }
            ]
        });
    }
    
    /**
     * 컨텍스트 생성 (AI 사용 가능한 이모티콘 목록)
     */
    function getContext() {
        const aiEmoticons = emoticons.filter(e => e.aiUsable);
        
        if (aiEmoticons.length === 0) {
            return null;
        }
        
        let context = '=== AI 사용 가능 이모티콘 ===\n';
        aiEmoticons.forEach(emo => {
            context += `• ${emo.name}: ![${emo.name}](${emo.url})\n`;
        });
        
        return context;
    }
    
    // 외부로 내보내기
    window.STLifeSimEmoticon = {
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
