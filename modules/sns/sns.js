/* ============================================================================
 * sns.js - SNS 피드 모듈
 * ============================================================================
 * 소셜 피드 시스템
 * - 유저 직접 포스팅
 * - AI NPC 랜덤 포스팅 (20% 확률)
 * - 댓글 & 답글 시스템
 * - 좋아요 기능
 * ========================================================================== */

import { storage } from '../../utils/storage.js';
import { send, echo, genAs, getCurrentCharacterName } from '../../utils/slash.js';
import { createPopup, confirm } from '../../utils/popup.js';
import { showSuccess, showError, createElement } from '../../utils/ui.js';
import { contextInjector, formatSection } from '../../utils/context-inject.js';

let snsFeed = [];
let contacts = [];
let popupInstance = null;

/**
 * 모듈 초기화
 */
export async function init() {
    console.log('[SNS] 모듈 초기화...');
    
    // CSS 로드
    loadCSS();
    
    // 데이터 로드
    loadSNS();
    loadContacts();
    
    // 툴바 버튼 추가
    addToolbarButton();
    
    // 컨텍스트 주입 등록
    contextInjector.register('sns', generateContext);
    
    // AI 응답 완료 시 랜덤 포스팅 트리거
    registerAutoPosting();
    
    console.log('[SNS] 모듈 초기화 완료');
}

/**
 * 모듈 정리
 */
export function cleanup() {
    contextInjector.unregister('sns');
    
    const btn = document.querySelector('#stls-sns-btn');
    if (btn) btn.remove();
    
    if (popupInstance) {
        popupInstance.close();
    }
    
    // 이벤트 리스너 제거
    if (window.eventSource) {
        window.eventSource.off('messageReceived', handleAutoPosting);
    }
}

/**
 * CSS 로드
 */
function loadCSS() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = new URL('./sns.css', import.meta.url).href;
    document.head.appendChild(link);
}

/**
 * 툴바 버튼 추가
 */
function addToolbarButton() {
    const toolbar = document.querySelector('#stls-quick-toolbar');
    if (!toolbar) {
        console.warn('[SNS] 퀵 툴바를 찾을 수 없습니다.');
        return;
    }
    
    const btn = createElement('button', {
        id: 'stls-sns-btn',
        className: 'stls-toolbar-btn',
        onClick: showSNSPopup
    }, '📸 SNS');
    
    toolbar.appendChild(btn);
}

/**
 * 자동 포스팅 등록
 */
function registerAutoPosting() {
    if (window.eventSource) {
        window.eventSource.on('messageReceived', handleAutoPosting);
    }
}

/**
 * 자동 포스팅 핸들러 (20% 확률)
 */
async function handleAutoPosting() {
    // 20% 확률로 발동
    if (Math.random() > 0.20) {
        return;
    }
    
    await triggerNpcPosting();
}

/**
 * NPC 랜덤 포스팅 트리거
 */
async function triggerNpcPosting() {
    try {
        // 후보군: {{char}} + 연락처 NPC들
        const charName = getCurrentCharacterName();
        const candidates = [charName, ...contacts.map(c => c.name)];
        
        if (candidates.length === 0) {
            return;
        }
        
        // 무작위 선택
        const author = candidates[Math.floor(Math.random() * candidates.length)];
        
        // AI에게 포스팅 생성 요청
        let prompt = '';
        if (author === charName) {
            prompt = `${charName}이 SNS에 게시물을 올렸다. 현재 상황과 성격에 어울리는 짧은 포스팅 텍스트와 해시태그를 작성하라. 이미지 묘사도 한 줄 추가.`;
        } else {
            const contact = contacts.find(c => c.name === author);
            const personality = contact?.personality || '평범함';
            const relation = contact?.relationToUser || '지인';
            
            prompt = `${author}이 SNS에 게시물을 올렸다. 성격: ${personality}. 관계: ${relation}. 짧은 포스팅 텍스트와 해시태그를 작성하라. 이미지 묘사도 한 줄 추가.`;
        }
        
        // 포스팅 생성 (슬래시 커맨드 사용)
        await genAs(prompt, author);
        
        // 완료 알림
        await echo(`📸 ${author}님이 새 게시물을 올렸습니다.`);
        
        // 피드에 추가 (AI 응답을 파싱하여 저장 - 실제로는 응답 내용을 받아야 하지만 여기서는 더미 데이터)
        // 실제 구현에서는 AI 응답을 받아서 저장해야 함
        const now = new Date().toISOString();
        snsFeed.push({
            id: Date.now().toString(),
            authorName: author,
            authorIsUser: false,
            date: now,
            content: '(AI가 생성한 포스팅 내용)',
            imageUrl: '',
            likes: 0,
            likedByUser: false,
            comments: [],
            isStory: false,
            includeInContext: true
        });
        
        saveSNS();
        
        console.log(`[SNS] ${author}님이 포스팅했습니다.`);
    } catch (error) {
        console.error('[SNS] 자동 포스팅 오류:', error);
    }
}

/**
 * SNS 팝업 표시
 */
function showSNSPopup() {
    function renderContent() {
        const container = createElement('div');
        
        // 헤더
        const header = createElement('div', { className: 'stls-sns-header' });
        
        const postBtn = createElement('button', {
            className: 'stls-btn stls-btn-primary',
            onClick: () => showPostForm()
        }, '✏️ 직접 올리기');
        
        const npcBtn = createElement('button', {
            className: 'stls-btn stls-btn-secondary',
            onClick: () => triggerNpcPosting()
        }, '🎲 NPC 포스팅');
        
        header.appendChild(postBtn);
        header.appendChild(npcBtn);
        
        // 피드
        const feed = createElement('div', {
            className: 'stls-sns-feed',
            id: 'sns-feed'
        });
        
        container.appendChild(header);
        container.appendChild(feed);
        
        updateFeed();
        
        return container;
    }
    
    function updateFeed() {
        const feed = document.getElementById('sns-feed');
        if (!feed) return;
        
        feed.innerHTML = '';
        
        if (snsFeed.length === 0) {
            feed.innerHTML = `
                <div class="stls-sns-empty">
                    <div class="stls-sns-empty-icon">📸</div>
                    <p>아직 포스팅이 없습니다.</p>
                    <p class="stls-text-sm stls-text-muted">첫 번째 게시물을 올려보세요!</p>
                </div>
            `;
            return;
        }
        
        // 최신순 정렬
        const sorted = [...snsFeed].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );
        
        sorted.forEach(post => {
            const postEl = renderPost(post);
            feed.appendChild(postEl);
        });
    }
    
    popupInstance = createPopup({
        title: '📸 SNS',
        content: renderContent(),
        buttons: [
            {
                text: '닫기',
                className: 'stls-btn-secondary'
            }
        ],
        width: '750px',
        height: '750px',
        onClose: () => {
            popupInstance = null;
        }
    });
}

/**
 * 포스트 렌더링
 */
function renderPost(post) {
    const container = createElement('div', { className: 'stls-sns-post' });
    
    const date = new Date(post.date);
    const dateStr = `${date.getMonth() + 1}월 ${date.getDate()}일`;
    
    // 헤더
    const header = createElement('div', { className: 'stls-sns-post-header' });
    header.innerHTML = `
        <img src="https://via.placeholder.com/48" class="stls-sns-post-avatar" alt="${post.authorName}" />
        <div class="stls-sns-post-author-info">
            <div class="stls-sns-post-author">${post.authorName}</div>
            <div class="stls-sns-post-date">${dateStr}</div>
        </div>
    `;
    
    // 콘텐츠
    const content = createElement('div', { className: 'stls-sns-post-content' }, post.content);
    
    // 이미지
    let image = null;
    if (post.imageUrl) {
        image = createElement('img', {
            src: post.imageUrl,
            className: 'stls-sns-post-image',
            alt: 'Post image'
        });
    }
    
    // 액션 버튼
    const actions = createElement('div', { className: 'stls-sns-post-actions' });
    
    const likeBtn = createElement('button', {
        className: `stls-sns-action-btn ${post.likedByUser ? 'liked' : ''}`,
        onClick: () => {
            post.likedByUser = !post.likedByUser;
            post.likes += post.likedByUser ? 1 : -1;
            saveSNS();
            showSNSPopup();
        }
    }, `❤️ ${post.likes}`);
    
    const commentBtn = createElement('button', {
        className: 'stls-sns-action-btn',
        onClick: () => toggleComments(post.id)
    }, `💬 댓글 ${post.comments.length}개`);
    
    actions.appendChild(likeBtn);
    actions.appendChild(commentBtn);
    
    // 댓글 섹션
    const commentsSection = createElement('div', {
        className: 'stls-sns-comments',
        id: `comments-${post.id}`,
        style: { display: 'none' }
    });
    
    // 기존 댓글 표시
    post.comments.forEach(comment => {
        const commentEl = createElement('div', { className: 'stls-sns-comment' });
        commentEl.innerHTML = `
            <span class="stls-sns-comment-author">${comment.author}</span>
            <span class="stls-sns-comment-text">${comment.text}</span>
        `;
        
        // 답글 표시
        if (comment.replies && comment.replies.length > 0) {
            comment.replies.forEach(reply => {
                const replyEl = createElement('div', { className: 'stls-sns-reply' });
                replyEl.innerHTML = `
                    <span class="stls-sns-comment-author">${reply.author}</span>
                    <span class="stls-sns-comment-text">${reply.text}</span>
                `;
                commentEl.appendChild(replyEl);
            });
        }
        
        commentsSection.appendChild(commentEl);
    });
    
    // 댓글 입력
    const commentInput = createElement('div', { className: 'stls-sns-comment-input' });
    const input = createElement('input', {
        type: 'text',
        className: 'stls-input',
        placeholder: '댓글을 입력하세요...',
        id: `comment-input-${post.id}`
    });
    const sendBtn = createElement('button', {
        className: 'stls-btn stls-btn-primary',
        onClick: () => addComment(post.id)
    }, '달기');
    
    commentInput.appendChild(input);
    commentInput.appendChild(sendBtn);
    commentsSection.appendChild(commentInput);
    
    // 조립
    container.appendChild(header);
    container.appendChild(content);
    if (image) container.appendChild(image);
    container.appendChild(actions);
    container.appendChild(commentsSection);
    
    return container;
}

/**
 * 댓글 섹션 토글
 */
function toggleComments(postId) {
    const section = document.getElementById(`comments-${postId}`);
    if (section) {
        section.style.display = section.style.display === 'none' ? 'block' : 'none';
    }
}

/**
 * 댓글 추가
 */
async function addComment(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    if (!input) return;
    
    const text = input.value.trim();
    if (!text) {
        showError('댓글 내용을 입력해주세요.');
        return;
    }
    
    const post = snsFeed.find(p => p.id === postId);
    if (!post) return;
    
    // 유저 댓글 추가
    const comment = {
        id: Date.now().toString(),
        author: 'user',
        text,
        date: new Date().toISOString(),
        replies: []
    };
    
    post.comments.push(comment);
    saveSNS();
    
    // 채팅에 댓글 메시지 전송
    await send(text);
    
    // AI에게 답글 생성 요청
    setTimeout(async () => {
        const authorName = post.authorName;
        await genAs(
            `${authorName}의 SNS 게시물에 {{user}}가 댓글을 달았다: "${text}". ${authorName}이 짧게 답글을 달아라.`,
            authorName
        );
        
        // 답글 추가 (실제로는 AI 응답을 받아야 함)
        comment.replies.push({
            author: authorName,
            text: '(AI가 생성한 답글)',
            date: new Date().toISOString()
        });
        
        saveSNS();
    }, 1000);
    
    showSuccess('댓글을 달았습니다.');
    
    // 팝업 새로고침
    showSNSPopup();
}

/**
 * 포스트 작성 폼
 */
function showPostForm() {
    const form = createElement('div', { className: 'stls-sns-form' });
    
    form.innerHTML = `
        <div class="stls-form-group">
            <label class="stls-label">글 내용</label>
            <textarea class="stls-textarea" id="post-content" placeholder="무슨 일이 있나요?" style="min-height: 120px;"></textarea>
        </div>
        
        <div class="stls-form-group">
            <label class="stls-label">이미지 URL (선택)</label>
            <input type="text" class="stls-input" id="post-image" placeholder="https://..." />
        </div>
        
        <div class="stls-form-group">
            <label>
                <input type="radio" name="post-type" value="post" checked /> 일반 게시물
                <input type="radio" name="post-type" value="story" style="margin-left: 16px;" /> 스토리
            </label>
        </div>
    `;
    
    const popup = createPopup({
        title: '✏️ 게시물 작성',
        content: form,
        buttons: [
            {
                text: '취소',
                className: 'stls-btn-secondary'
            },
            {
                text: '올리기',
                className: 'stls-btn-primary',
                onClick: async () => {
                    const content = form.querySelector('#post-content').value.trim();
                    const imageUrl = form.querySelector('#post-image').value.trim();
                    const isStory = form.querySelector('input[name="post-type"]:checked').value === 'story';
                    
                    if (!content) {
                        showError('내용을 입력해주세요.');
                        return;
                    }
                    
                    // 피드에 추가
                    const post = {
                        id: Date.now().toString(),
                        authorName: 'user',
                        authorIsUser: true,
                        date: new Date().toISOString(),
                        content,
                        imageUrl,
                        likes: 0,
                        likedByUser: false,
                        comments: [],
                        isStory,
                        includeInContext: true
                    };
                    
                    snsFeed.push(post);
                    saveSNS();
                    
                    // 채팅에 메시지 전송
                    await send(content);
                    
                    showSuccess('게시물을 올렸습니다.');
                    
                    // SNS 팝업 새로고침
                    if (popupInstance) {
                        showSNSPopup();
                    }
                }
            }
        ],
        width: '500px'
    });
}

/**
 * SNS 데이터 로드
 */
function loadSNS() {
    snsFeed = storage.getData('sns', 'feed', [], 'chat');
}

/**
 * SNS 데이터 저장
 */
function saveSNS() {
    storage.setData('sns', 'feed', snsFeed, 'chat');
}

/**
 * 연락처 로드 (NPC 포스팅용)
 */
function loadContacts() {
    contacts = storage.getData('contacts', 'list', [], 'chat');
}

/**
 * 컨텍스트 생성
 */
function generateContext() {
    const recentPosts = snsFeed
        .filter(p => p.includeInContext)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3);
    
    if (recentPosts.length === 0) {
        return '';
    }
    
    const items = recentPosts.map(p => {
        const date = new Date(p.date);
        const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
        return `${p.authorName}: "${p.content.substring(0, 50)}${p.content.length > 50 ? '...' : ''}" (${dateStr})`;
    });
    
    return formatSection('최근 SNS (컨텍스트 포함 설정 기준)', items);
}

/**
 * SNS 팝업 표시 (외부에서 호출 가능)
 */
export function showSNSPanel() {
    showSNSPopup();
}

export default {
    init,
    cleanup,
    showSNSPanel
};
