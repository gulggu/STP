/* ============================================================================
 * contacts.js - NPC 연락처 모듈
 * ============================================================================
 * 주변 인물 관리 시스템
 * - NPC 프로필 등록 (이름, 이미지, 설명, 관계, 성격 등)
 * - 채팅별/캐릭터별 바인딩
 * - 컨텍스트 주입으로 AI가 인식
 * ========================================================================== */

import { storage } from '../../utils/storage.js';
import { createPopup, confirm } from '../../utils/popup.js';
import { showSuccess, showError, createElement } from '../../utils/ui.js';
import { contextInjector, formatSection } from '../../utils/context-inject.js';

let contacts = [];
let binding = 'chat'; // 'chat' or 'character'
let popupInstance = null;

/**
 * 모듈 초기화
 */
export async function init() {
    console.log('[Contacts] 모듈 초기화...');
    
    // CSS 로드
    loadCSS();
    
    // 데이터 로드
    loadContacts();
    
    // 툴바 버튼 추가
    addToolbarButton();
    
    // 컨텍스트 주입 등록
    contextInjector.register('contacts', generateContext);
    
    console.log('[Contacts] 모듈 초기화 완료');
}

/**
 * 모듈 정리
 */
export function cleanup() {
    contextInjector.unregister('contacts');
    
    const btn = document.querySelector('#stls-contacts-btn');
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
    link.href = new URL('./contacts.css', import.meta.url).href;
    document.head.appendChild(link);
}

/**
 * 툴바 버튼 추가
 */
function addToolbarButton() {
    const toolbar = document.querySelector('#stls-quick-toolbar');
    if (!toolbar) {
        console.warn('[Contacts] 퀵 툴바를 찾을 수 없습니다.');
        return;
    }
    
    const btn = createElement('button', {
        id: 'stls-contacts-btn',
        className: 'stls-toolbar-btn',
        onClick: showContactsPopup
    }, '📋 연락처');
    
    toolbar.appendChild(btn);
}

/**
 * 연락처 팝업 표시
 */
function showContactsPopup() {
    let searchQuery = '';
    
    function renderContent() {
        const container = createElement('div');
        
        // 헤더
        const header = createElement('div', { className: 'stls-contacts-header' });
        
        const searchInput = createElement('input', {
            type: 'text',
            className: 'stls-input stls-contacts-search',
            placeholder: '🔍 이름 또는 태그로 검색...',
            value: searchQuery,
            onInput: (e) => {
                searchQuery = e.target.value;
                updateContent();
            }
        });
        
        const addBtn = createElement('button', {
            className: 'stls-btn stls-btn-primary',
            onClick: () => showContactForm()
        }, '+ 새 연락처');
        
        header.appendChild(searchInput);
        header.appendChild(addBtn);
        
        // 연락처 목록
        const list = createElement('div', {
            className: 'stls-contacts-list',
            id: 'contacts-list'
        });
        
        // 바인딩 설정
        const bindingSection = createElement('div', { className: 'stls-contact-binding' });
        bindingSection.innerHTML = `
            <label class="stls-label">저장 방식</label>
            <label style="display: flex; gap: 16px; margin-top: 8px;">
                <input type="radio" name="binding" value="chat" ${binding === 'chat' ? 'checked' : ''} /> 이 채팅
                <input type="radio" name="binding" value="character" ${binding === 'character' ? 'checked' : ''} /> 이 캐릭터
            </label>
            <p class="stls-text-sm stls-text-muted" style="margin-top: 8px;">
                ${binding === 'chat' ? '현재 채팅에만 연락처가 표시됩니다.' : '같은 캐릭터의 모든 채팅에서 연락처가 공유됩니다.'}
            </p>
        `;
        
        container.appendChild(header);
        container.appendChild(list);
        container.appendChild(bindingSection);
        
        // 바인딩 변경 이벤트
        setTimeout(() => {
            const radios = bindingSection.querySelectorAll('input[name="binding"]');
            radios.forEach(radio => {
                radio.addEventListener('change', (e) => {
                    binding = e.target.value;
                    loadContacts();
                    updateContent();
                    bindingSection.querySelector('p').textContent = 
                        binding === 'chat' ? '현재 채팅에만 연락처가 표시됩니다.' : '같은 캐릭터의 모든 채팅에서 연락처가 공유됩니다.';
                });
            });
        }, 100);
        
        updateList();
        
        return container;
    }
    
    function updateContent() {
        const list = document.getElementById('contacts-list');
        if (list) {
            list.innerHTML = '';
            updateList();
        }
    }
    
    function updateList() {
        const list = document.getElementById('contacts-list');
        if (!list) return;
        
        // 필터링
        let filtered = contacts;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = contacts.filter(c =>
                c.name.toLowerCase().includes(query) ||
                c.description?.toLowerCase().includes(query) ||
                c.tags?.some(t => t.toLowerCase().includes(query))
            );
        }
        
        // 렌더링
        if (filtered.length === 0) {
            list.innerHTML = `
                <div class="stls-contact-empty">
                    <div class="stls-contact-empty-icon">📋</div>
                    <p>등록된 연락처가 없습니다.</p>
                    <p class="stls-text-sm stls-text-muted">+ 새 연락처 버튼을 눌러 추가해보세요.</p>
                </div>
            `;
            return;
        }
        
        filtered.forEach(contact => {
            const item = createElement('div', { className: 'stls-contact-item' });
            
            const avatar = createElement('img', {
                src: contact.avatar || 'https://via.placeholder.com/60',
                className: 'stls-contact-avatar',
                alt: contact.name,
                onerror: function() {
                    this.src = 'https://via.placeholder.com/60';
                }
            });
            
            const info = createElement('div', { className: 'stls-contact-info' });
            info.innerHTML = `
                <div class="stls-contact-name">${contact.name}</div>
                <div class="stls-contact-desc">${contact.description || '설명 없음'}</div>
                <div class="stls-contact-desc">{{user}}와의 관계: ${contact.relationToUser || '정보 없음'}</div>
                ${contact.relationToChar ? `<div class="stls-contact-desc">{{char}}와의 관계: ${contact.relationToChar}</div>` : ''}
                ${contact.tags && contact.tags.length > 0 ? `
                    <div class="stls-contact-tags">
                        ${contact.tags.map(tag => `<span class="stls-contact-tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
            `;
            
            const actions = createElement('div', { className: 'stls-contact-actions' });
            
            const editBtn = createElement('button', {
                className: 'stls-btn stls-btn-secondary',
                onClick: () => showContactForm(contact.id)
            }, '편집');
            
            const deleteBtn = createElement('button', {
                className: 'stls-btn stls-btn-danger',
                onClick: async () => {
                    const confirmed = await confirm(`"${contact.name}"을(를) 삭제하시겠습니까?`);
                    if (confirmed) {
                        deleteContact(contact.id);
                        updateContent();
                    }
                }
            }, '삭제');
            
            actions.appendChild(editBtn);
            actions.appendChild(deleteBtn);
            
            item.appendChild(avatar);
            item.appendChild(info);
            item.appendChild(actions);
            
            list.appendChild(item);
        });
    }
    
    popupInstance = createPopup({
        title: '📋 연락처',
        content: renderContent(),
        buttons: [
            {
                text: '닫기',
                className: 'stls-btn-secondary'
            }
        ],
        width: '750px',
        height: '700px',
        onClose: () => {
            popupInstance = null;
        }
    });
}

/**
 * 연락처 추가/편집 폼
 */
function showContactForm(editId = null) {
    const editing = editId ? contacts.find(c => c.id === editId) : null;
    
    const form = createElement('div', { className: 'stls-contact-form' });
    
    form.innerHTML = `
        <div class="stls-form-group">
            <label class="stls-label">이름 *</label>
            <input type="text" class="stls-input" id="contact-name" value="${editing?.name || ''}" placeholder="예: 홍길동" />
        </div>
        
        <div class="stls-form-group">
            <label class="stls-label">프로필 이미지 URL</label>
            <input type="text" class="stls-input" id="contact-avatar" value="${editing?.avatar || ''}" placeholder="https://..." />
        </div>
        
        <div class="stls-form-group">
            <label class="stls-label">한줄 소개 *</label>
            <input type="text" class="stls-input" id="contact-desc" value="${editing?.description || ''}" placeholder="예: 대학 선배" />
        </div>
        
        <div class="stls-form-group">
            <label class="stls-label">{{user}}와의 관계 *</label>
            <input type="text" class="stls-input" id="contact-rel-user" value="${editing?.relationToUser || ''}" placeholder="예: 소꿉친구" />
        </div>
        
        <div class="stls-form-group">
            <label class="stls-label">{{char}}와의 관계</label>
            <input type="text" class="stls-input" id="contact-rel-char" value="${editing?.relationToChar || ''}" placeholder="예: 직장 동료, 서먹함" />
        </div>
        
        <div class="stls-form-group">
            <label class="stls-label">성격/말투</label>
            <textarea class="stls-textarea" id="contact-personality" placeholder="예: 유쾌하고 털털함">${editing?.personality || ''}</textarea>
        </div>
        
        <div class="stls-form-group">
            <label class="stls-label">전화번호</label>
            <input type="text" class="stls-input" id="contact-phone" value="${editing?.phone || ''}" placeholder="010-0000-0000" />
        </div>
        
        <div class="stls-form-group">
            <label class="stls-label">태그 (쉼표로 구분)</label>
            <input type="text" class="stls-input" id="contact-tags" value="${editing?.tags?.join(', ') || ''}" placeholder="예: 친구, 동료" />
        </div>
    `;
    
    const popup = createPopup({
        title: editing ? '연락처 편집' : '연락처 등록',
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
                    const name = form.querySelector('#contact-name').value.trim();
                    const avatar = form.querySelector('#contact-avatar').value.trim();
                    const description = form.querySelector('#contact-desc').value.trim();
                    const relationToUser = form.querySelector('#contact-rel-user').value.trim();
                    const relationToChar = form.querySelector('#contact-rel-char').value.trim();
                    const personality = form.querySelector('#contact-personality').value.trim();
                    const phone = form.querySelector('#contact-phone').value.trim();
                    const tagsStr = form.querySelector('#contact-tags').value.trim();
                    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];
                    
                    if (!name || !description || !relationToUser) {
                        showError('이름, 한줄 소개, {{user}}와의 관계는 필수입니다.');
                        return;
                    }
                    
                    if (editing) {
                        // 수정
                        Object.assign(editing, {
                            name,
                            avatar,
                            description,
                            relationToUser,
                            relationToChar,
                            personality,
                            phone,
                            tags
                        });
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
                    showSuccess(editing ? '연락처를 수정했습니다.' : '연락처를 추가했습니다.');
                    
                    // 메인 팝업 업데이트
                    if (popupInstance) {
                        showContactsPopup();
                    }
                }
            }
        ],
        width: '600px',
        height: '650px'
    });
}

/**
 * 연락처 삭제
 */
function deleteContact(id) {
    contacts = contacts.filter(c => c.id !== id);
    saveContacts();
    showSuccess('연락처를 삭제했습니다.');
}

/**
 * 연락처 로드
 */
function loadContacts() {
    contacts = storage.getData('contacts', 'list', [], binding);
}

/**
 * 연락처 저장
 */
function saveContacts() {
    storage.setData('contacts', 'list', contacts, binding);
}

/**
 * 컨텍스트 생성
 */
function generateContext() {
    if (contacts.length === 0) {
        return '';
    }
    
    const items = contacts.map(c => {
        let line = `${c.name} | {{user}}의 ${c.relationToUser}`;
        
        if (c.relationToChar) {
            line += ` | {{char}}와: ${c.relationToChar}`;
        }
        
        if (c.personality) {
            line += ` | 성격: ${c.personality}`;
        }
        
        return line;
    });
    
    items.push('→ 이 인물들은 언제든 {{user}}에게 연락하거나 {{char}}의 대화에 언급될 수 있음');
    
    return formatSection('주변 인물', items);
}

/**
 * 연락처 팝업 표시 (외부에서 호출 가능)
 */
export function showContactsPanel() {
    showContactsPopup();
}

export default {
    init,
    cleanup,
    showContactsPanel
};
