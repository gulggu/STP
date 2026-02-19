/* ===========================================
   contacts.js - NPC 연락처 모듈
   =========================================== */

(function() {
    'use strict';
    
    // 연락처 데이터
    let contacts = [];
    let searchQuery = '';
    let bindingType = 'chat'; // 'chat' or 'character'
    
    /**
     * 초기화
     */
    function initialize() {
        console.log('[ST-LifeSim] Contacts 모듈 로딩...');
        
        // 저장된 연락처 불러오기
        loadContacts();
        
        // 툴바에 버튼 추가
        addToolbarButton();
        
        console.log('[ST-LifeSim] Contacts 모듈 로드 완료');
    }
    
    /**
     * 연락처 불러오기
     */
    function loadContacts() {
        const storage = window.STLifeSimStorage;
        if (storage) {
            // 바인딩 타입 불러오기
            bindingType = storage.loadData('contactsBinding', 'chat', storage.STORAGE_TYPE.CHAT);
            
            // 연락처 불러오기
            const storageType = bindingType === 'character' 
                ? storage.STORAGE_TYPE.CHARACTER 
                : storage.STORAGE_TYPE.CHAT;
            contacts = storage.loadData('contacts', [], storageType);
        }
    }
    
    /**
     * 연락처 저장
     */
    function saveContacts() {
        const storage = window.STLifeSimStorage;
        if (storage) {
            // 바인딩 타입 저장
            storage.saveData('contactsBinding', bindingType, storage.STORAGE_TYPE.CHAT);
            
            // 연락처 저장
            const storageType = bindingType === 'character' 
                ? storage.STORAGE_TYPE.CHARACTER 
                : storage.STORAGE_TYPE.CHAT;
            storage.saveData('contacts', contacts, storageType);
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
        btn.textContent = '📋 연락처';
        btn.addEventListener('click', showContactsPanel);
        toolbar.appendChild(btn);
    }
    
    /**
     * 연락처 패널 표시
     */
    function showContactsPanel() {
        const content = createContactsPanel();
        
        window.STLifeSimPopup?.createPopup?.({
            title: '📋 연락처',
            content: content,
            width: '700px',
            height: '600px'
        });
    }
    
    /**
     * 연락처 패널 생성
     */
    function createContactsPanel() {
        const container = document.createElement('div');
        
        // 검색창과 추가 버튼
        const header = document.createElement('div');
        header.style.cssText = 'display: flex; gap: 10px; align-items: center;';
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'stls-input';
        searchInput.placeholder = '🔍 검색...';
        searchInput.style.flex = '1';
        searchInput.value = searchQuery;
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderContactList(container);
        });
        
        const addBtn = document.createElement('button');
        addBtn.className = 'stls-btn stls-btn-primary';
        addBtn.textContent = '+ 새 연락처';
        addBtn.addEventListener('click', () => showContactDialog(null));
        
        header.appendChild(searchInput);
        header.appendChild(addBtn);
        container.appendChild(header);
        
        // 연락처 리스트
        const listContainer = document.createElement('div');
        listContainer.id = 'stls-contact-list-container';
        listContainer.style.cssText = 'max-height: 400px; overflow-y: auto; margin-top: 15px;';
        container.appendChild(listContainer);
        
        // 바인딩 설정
        const bindingSection = document.createElement('div');
        bindingSection.className = 'stls-contact-binding';
        bindingSection.innerHTML = `
            <label style="color: var(--SmartThemeEmColor, #fff);">
                저장 방식:
            </label>
            <label style="color: var(--SmartThemeEmColor, #fff);">
                <input type="radio" name="contactBinding" value="chat" ${bindingType === 'chat' ? 'checked' : ''}>
                이 채팅
            </label>
            <label style="color: var(--SmartThemeEmColor, #fff);">
                <input type="radio" name="contactBinding" value="character" ${bindingType === 'character' ? 'checked' : ''}>
                이 캐릭터
            </label>
        `;
        
        bindingSection.querySelectorAll('input[name="contactBinding"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const oldBinding = bindingType;
                bindingType = e.target.value;
                
                if (oldBinding !== bindingType) {
                    window.STLifeSimPopup?.showConfirm?.(
                        '저장 방식을 변경하면 현재 연락처를 새 저장소로 이동합니다. 계속하시겠습니까?',
                        () => {
                            saveContacts();
                            loadContacts();
                            renderContactList(container);
                            window.STLifeSimUI?.showSuccess?.('저장 방식을 변경했습니다.');
                        },
                        () => {
                            // 취소 시 원래대로
                            bindingType = oldBinding;
                            bindingSection.querySelector(`input[value="${bindingType}"]`).checked = true;
                        }
                    );
                }
            });
        });
        
        container.appendChild(bindingSection);
        
        // 초기 렌더링
        renderContactList(container);
        
        return container;
    }
    
    /**
     * 연락처 리스트 렌더링
     */
    function renderContactList(container) {
        const listContainer = container.querySelector('#stls-contact-list-container');
        if (!listContainer) return;
        
        // 필터링
        let filtered = contacts;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = contacts.filter(c => 
                c.name.toLowerCase().includes(query) ||
                c.description.toLowerCase().includes(query) ||
                c.tags.some(t => t.toLowerCase().includes(query))
            );
        }
        
        // 리스트 생성
        listContainer.innerHTML = '';
        
        if (filtered.length === 0) {
            listContainer.innerHTML = '<p style="text-align: center; padding: 40px; color: #888;">등록된 연락처가 없습니다.</p>';
        } else {
            filtered.forEach(contact => {
                const item = createContactItem(contact, container);
                listContainer.appendChild(item);
            });
        }
    }
    
    /**
     * 연락처 아이템 생성
     */
    function createContactItem(contact, container) {
        const item = document.createElement('div');
        item.className = 'stls-contact-item';
        
        // 아바타
        const avatar = document.createElement('img');
        avatar.className = 'stls-contact-avatar';
        avatar.src = contact.avatar || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50"><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="30">👤</text></svg>';
        avatar.onerror = () => {
            avatar.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50"><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="30">👤</text></svg>';
        };
        
        // 정보
        const info = document.createElement('div');
        info.className = 'stls-contact-info';
        
        const name = document.createElement('div');
        name.className = 'stls-contact-name';
        name.textContent = contact.name;
        
        const desc = document.createElement('div');
        desc.className = 'stls-contact-desc';
        desc.textContent = contact.description;
        
        const tags = document.createElement('div');
        tags.className = 'stls-contact-tags';
        contact.tags.forEach(tag => {
            const tagEl = document.createElement('span');
            tagEl.className = 'stls-contact-tag';
            tagEl.textContent = tag;
            tags.appendChild(tagEl);
        });
        
        info.appendChild(name);
        info.appendChild(desc);
        if (contact.tags.length > 0) {
            info.appendChild(tags);
        }
        
        // 액션 버튼
        const actions = document.createElement('div');
        actions.className = 'stls-contact-actions';
        
        const editBtn = document.createElement('button');
        editBtn.className = 'stls-btn';
        editBtn.textContent = '편집';
        editBtn.style.cssText = 'padding: 6px 12px; font-size: 13px;';
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showContactDialog(contact, container);
        });
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'stls-btn';
        deleteBtn.textContent = '삭제';
        deleteBtn.style.cssText = 'padding: 6px 12px; font-size: 13px;';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            window.STLifeSimPopup?.showConfirm?.(
                `"${contact.name}" 연락처를 삭제하시겠습니까?`,
                () => {
                    contacts = contacts.filter(c => c.id !== contact.id);
                    saveContacts();
                    renderContactList(container);
                    window.STLifeSimUI?.showSuccess?.('연락처를 삭제했습니다.');
                }
            );
        });
        
        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);
        
        item.appendChild(avatar);
        item.appendChild(info);
        item.appendChild(actions);
        
        return item;
    }
    
    /**
     * 연락처 추가/편집 다이얼로그
     */
    function showContactDialog(contact = null, parentContainer = null) {
        const isEdit = contact !== null;
        
        const content = document.createElement('div');
        content.innerHTML = `
            <div class="stls-form-group">
                <label class="stls-form-label">이름 *</label>
                <input type="text" class="stls-input" id="stls-contact-name" value="${contact?.name || ''}" required>
            </div>
            <div class="stls-form-group">
                <label class="stls-form-label">프로필 이미지 URL</label>
                <input type="text" class="stls-input" id="stls-contact-avatar" value="${contact?.avatar || ''}">
            </div>
            <div class="stls-form-group">
                <label class="stls-form-label">한줄 소개 *</label>
                <input type="text" class="stls-input" id="stls-contact-desc" value="${contact?.description || ''}" placeholder="예: 대학 선배" required>
            </div>
            <div class="stls-form-group">
                <label class="stls-form-label">{{user}}와의 관계 *</label>
                <input type="text" class="stls-input" id="stls-contact-rel-user" value="${contact?.relationToUser || ''}" placeholder="예: 소꿉친구" required>
            </div>
            <div class="stls-form-group">
                <label class="stls-form-label">{{char}}와의 관계</label>
                <input type="text" class="stls-input" id="stls-contact-rel-char" value="${contact?.relationToChar || ''}" placeholder="예: 직장 동료, 어색함">
            </div>
            <div class="stls-form-group">
                <label class="stls-form-label">성격/말투</label>
                <textarea class="stls-textarea" id="stls-contact-personality">${contact?.personality || ''}</textarea>
            </div>
            <div class="stls-form-group">
                <label class="stls-form-label">전화번호</label>
                <input type="text" class="stls-input" id="stls-contact-phone" value="${contact?.phone || ''}">
            </div>
            <div class="stls-form-group">
                <label class="stls-form-label">태그 (쉼표로 구분)</label>
                <input type="text" class="stls-input" id="stls-contact-tags" value="${contact?.tags?.join(', ') || ''}" placeholder="예: 친구, 회사">
            </div>
        `;
        
        window.STLifeSimPopup?.createPopup?.({
            title: isEdit ? '연락처 편집' : '연락처 등록',
            content: content,
            buttons: [
                { text: '취소' },
                {
                    text: '저장',
                    primary: true,
                    onClick: () => {
                        const name = content.querySelector('#stls-contact-name').value.trim();
                        const avatar = content.querySelector('#stls-contact-avatar').value.trim();
                        const description = content.querySelector('#stls-contact-desc').value.trim();
                        const relationToUser = content.querySelector('#stls-contact-rel-user').value.trim();
                        const relationToChar = content.querySelector('#stls-contact-rel-char').value.trim();
                        const personality = content.querySelector('#stls-contact-personality').value.trim();
                        const phone = content.querySelector('#stls-contact-phone').value.trim();
                        const tagsStr = content.querySelector('#stls-contact-tags').value.trim();
                        const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(t => t) : [];
                        
                        if (!name || !description || !relationToUser) {
                            window.STLifeSimUI?.showError?.('필수 항목을 입력해주세요.');
                            return;
                        }
                        
                        if (isEdit) {
                            // 편집
                            contact.name = name;
                            contact.avatar = avatar;
                            contact.description = description;
                            contact.relationToUser = relationToUser;
                            contact.relationToChar = relationToChar;
                            contact.personality = personality;
                            contact.phone = phone;
                            contact.tags = tags;
                        } else {
                            // 추가
                            contacts.push({
                                id: Date.now().toString(),
                                name,
                                avatar,
                                description,
                                relationToUser,
                                relationToChar,
                                personality,
                                phone,
                                tags
                            });
                        }
                        
                        saveContacts();
                        window.STLifeSimUI?.showSuccess?.(isEdit ? '연락처를 수정했습니다.' : '연락처를 추가했습니다.');
                        
                        if (parentContainer) {
                            renderContactList(parentContainer);
                        }
                    }
                }
            ]
        });
    }
    
    /**
     * 컨텍스트 생성
     */
    function getContext() {
        if (contacts.length === 0) {
            return null;
        }
        
        const charName = window.STLifeSimSlash?.getCurrentCharacterName?.() || '{{char}}';
        
        let context = '=== 주변 인물 ===\n';
        contacts.forEach(contact => {
            let line = `• ${contact.name} | {{user}}의 ${contact.relationToUser}`;
            
            if (contact.relationToChar) {
                line += ` | ${charName}와: ${contact.relationToChar}`;
            } else {
                line += ` | ${charName}는 모름`;
            }
            
            if (contact.personality) {
                line += ` | 성격: ${contact.personality}`;
            }
            
            context += line + '\n';
        });
        
        context += `→ 이 인물들은 언제든 {{user}}에게 연락하거나 ${charName}의 대화에 언급될 수 있음`;
        
        return context;
    }
    
    // 외부로 내보내기
    window.STLifeSimContacts = {
        initialize,
        getContext,
        getContacts: () => contacts
    };
    
    // 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();
