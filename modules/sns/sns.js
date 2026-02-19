/* ===========================================
   sns.js - SNS 피드 모듈
   =========================================== */

(function() {
    'use strict';
    
    // SNS 데이터
    let snsFeed = [];
    let autoPostingEnabled = true;
    let autoPostingChance = 0.20; // 20% 확률
    
    /**
     * 초기화
     */
    function initialize() {
        console.log('[ST-LifeSim] SNS 모듈 로딩...');
        
        // 저장된 피드 불러오기
        loadFeed();
        
        // 툴바에 버튼 추가
        addToolbarButton();
        
        // 자동 포스팅 이벤트 등록
        registerAutoPosting();
        
        console.log('[ST-LifeSim] SNS 모듈 로드 완료');
    }
    
    /**
     * 피드 불러오기
     */
    function loadFeed() {
        const storage = window.STLifeSimStorage;
        if (storage) {
            snsFeed = storage.loadData('snsFeed', [], storage.STORAGE_TYPE.CHAT);
        }
    }
    
    /**
     * 피드 저장
     */
    function saveFeed() {
        const storage = window.STLifeSimStorage;
        if (storage) {
            storage.saveData('snsFeed', snsFeed, storage.STORAGE_TYPE.CHAT);
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
        btn.textContent = '📸 SNS';
        btn.addEventListener('click', showSNSPanel);
        toolbar.appendChild(btn);
    }
    
    /**
     * 자동 포스팅 이벤트 등록
     */
    function registerAutoPosting() {
        // SillyTavern의 메시지 수신 이벤트에 리스너 등록
        if (window.eventSource) {
            window.eventSource.on('MESSAGE_RECEIVED', () => {
                if (autoPostingEnabled && Math.random() < autoPostingChance) {
                    setTimeout(() => triggerNpcPosting(), 1000);
                }
            });
            console.log('[ST-LifeSim] SNS 자동 포스팅 이벤트 등록 완료');
        }
    }
    
    /**
     * NPC 랜덤 포스팅 트리거
     */
    async function triggerNpcPosting() {
        const slash = window.STLifeSimSlash;
        if (!slash) return;
        
        // 후보군: {{char}} + 모든 연락처
        const candidates = [];
        
        // {{char}} 추가
        const charName = slash.getCurrentCharacterName();
        candidates.push({ name: charName, personality: '', relation: '', isChar: true });
        
        // 연락처 추가
        const contacts = window.STLifeSimContacts?.getContacts?.() || [];
        contacts.forEach(contact => {
            candidates.push({
                name: contact.name,
                personality: contact.personality || '',
                relation: contact.relationToUser || '',
                isChar: false
            });
        });
        
        if (candidates.length === 0) return;
        
        // 랜덤 선택
        const selected = candidates[Math.floor(Math.random() * candidates.length)];
        
        // 포스팅 생성
        let prompt;
        if (selected.isChar) {
            prompt = `${selected.name}이 SNS에 게시물을 올렸다. 현재 상황과 성격에 어울리는 짧은 포스팅 텍스트와 해시태그를 작성하라. 이미지 묘사도 한 줄 추가.`;
        } else {
            prompt = `${selected.name}이 SNS에 게시물을 올렸다. 성격: ${selected.personality || '알 수 없음'}. 관계: ${selected.relation}. 짧은 포스팅 텍스트와 해시태그를 작성하라. 이미지 묘사도 한 줄 추가.`;
        }
        
        // AI 생성 (비동기로 실행, 결과는 이벤트로 받음)
        await slash.generateAndSend(prompt, selected.name);
        
        // 알림 전송
        setTimeout(async () => {
            await slash.echoMessage(`📸 ${selected.name}님이 새 게시물을 올렸습니다.`);
        }, 2000);
        
        // 피드에 기록 (실제 내용은 사용자가 수동으로 추가해야 함)
        // 여기서는 플레이스홀더만 추가
        snsFeed.unshift({
            id: Date.now().toString(),
            authorName: selected.name,
            authorIsUser: false,
            date: new Date().toISOString(),
            content: '(생성된 내용을 여기에 기록)',
            imageUrl: '',
            likes: 0,
            likedByUser: false,
            comments: [],
            isStory: false,
            includeInContext: true
        });
        
        saveFeed();
    }
    
    /**
     * SNS 패널 표시
     */
    function showSNSPanel() {
        const content = createSNSPanel();
        
        window.STLifeSimPopup?.createPopup?.({
            title: '📸 SNS',
            content: content,
            width: '700px',
            height: '700px'
        });
    }
    
    /**
     * SNS 패널 생성
     */
    function createSNSPanel() {
        const container = document.createElement('div');
        
        // 헤더 (탭 + 액션 버튼)
        const header = document.createElement('div');
        header.className = 'stls-sns-header';
        
        const tabs = document.createElement('div');
        tabs.style.flex = '1';
        tabs.innerHTML = `
            <div class="stls-tabs" style="border-bottom: none; margin-bottom: 0;">
                <button class="stls-tab active" data-tab="feed">피드</button>
                <button class="stls-tab" data-tab="story">스토리</button>
            </div>
        `;
        
        const postBtn = document.createElement('button');
        postBtn.className = 'stls-btn stls-btn-primary';
        postBtn.textContent = '✏️ 직접 올리기';
        postBtn.addEventListener('click', () => showCreatePostDialog());
        
        const npcBtn = document.createElement('button');
        npcBtn.className = 'stls-btn';
        npcBtn.textContent = '🎲 NPC 포스팅';
        npcBtn.addEventListener('click', () => triggerNpcPosting());
        
        header.appendChild(tabs);
        header.appendChild(postBtn);
        header.appendChild(npcBtn);
        container.appendChild(header);
        
        // 탭 이벤트
        tabs.querySelectorAll('.stls-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                tabs.querySelectorAll('.stls-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                renderFeed(container, e.target.dataset.tab);
            });
        });
        
        // 피드 영역
        const feedContainer = document.createElement('div');
        feedContainer.id = 'stls-sns-feed-container';
        feedContainer.className = 'stls-sns-feed';
        container.appendChild(feedContainer);
        
        // 초기 렌더링
        renderFeed(container, 'feed');
        
        return container;
    }
    
    /**
     * 피드 렌더링
     */
    function renderFeed(container, tabType) {
        const feedContainer = container.querySelector('#stls-sns-feed-container');
        if (!feedContainer) return;
        
        feedContainer.innerHTML = '';
        
        // 필터링
        const filtered = snsFeed.filter(post => {
            if (tabType === 'story') {
                return post.isStory;
            }
            return !post.isStory;
        });
        
        if (filtered.length === 0) {
            feedContainer.innerHTML = '<p style="text-align: center; padding: 40px; color: #888;">게시물이 없습니다.</p>';
            return;
        }
        
        filtered.forEach(post => {
            const postEl = createPostElement(post, container);
            feedContainer.appendChild(postEl);
        });
    }
    
    /**
     * 게시물 엘리먼트 생성
     */
    function createPostElement(post, container) {
        const postEl = document.createElement('div');
        postEl.className = 'stls-sns-post';
        
        // 헤더 (작성자 정보)
        const header = document.createElement('div');
        header.className = 'stls-sns-post-header';
        
        const avatar = document.createElement('img');
        avatar.className = 'stls-sns-avatar';
        avatar.src = post.authorAvatar || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="24">👤</text></svg>';
        avatar.onerror = () => {
            avatar.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><text x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="24">👤</text></svg>';
        };
        
        const authorInfo = document.createElement('div');
        authorInfo.className = 'stls-sns-author-info';
        
        const date = new Date(post.date);
        const dateStr = date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
        
        authorInfo.innerHTML = `
            <div class="stls-sns-author-name">
                ${post.authorName}
                ${post.isStory ? '<span class="stls-sns-story-badge">스토리</span>' : ''}
            </div>
            <div class="stls-sns-post-date">${dateStr}</div>
        `;
        
        header.appendChild(avatar);
        header.appendChild(authorInfo);
        postEl.appendChild(header);
        
        // 내용
        const content = document.createElement('div');
        content.className = 'stls-sns-post-content';
        content.textContent = post.content;
        postEl.appendChild(content);
        
        // 이미지 (있을 경우)
        if (post.imageUrl) {
            const img = document.createElement('img');
            img.className = 'stls-sns-post-image';
            img.src = post.imageUrl;
            img.onerror = () => img.remove();
            postEl.appendChild(img);
        }
        
        // 액션 버튼
        const actions = document.createElement('div');
        actions.className = 'stls-sns-post-actions';
        
        const likeBtn = document.createElement('button');
        likeBtn.className = `stls-sns-action-btn ${post.likedByUser ? 'liked' : ''}`;
        likeBtn.innerHTML = `❤️ ${post.likes}`;
        likeBtn.addEventListener('click', () => {
            post.likedByUser = !post.likedByUser;
            post.likes += post.likedByUser ? 1 : -1;
            saveFeed();
            renderFeed(container, post.isStory ? 'story' : 'feed');
        });
        
        const commentBtn = document.createElement('button');
        commentBtn.className = 'stls-sns-action-btn';
        commentBtn.innerHTML = `💬 댓글 ${post.comments.length}개 보기`;
        commentBtn.addEventListener('click', (e) => {
            const commentsSection = postEl.querySelector('.stls-sns-comments');
            if (commentsSection.style.display === 'none') {
                commentsSection.style.display = 'block';
                commentBtn.innerHTML = `💬 댓글 숨기기`;
            } else {
                commentsSection.style.display = 'none';
                commentBtn.innerHTML = `💬 댓글 ${post.comments.length}개 보기`;
            }
        });
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'stls-sns-action-btn';
        deleteBtn.textContent = '🗑️ 삭제';
        deleteBtn.addEventListener('click', () => {
            window.STLifeSimPopup?.showConfirm?.(
                '이 게시물을 삭제하시겠습니까?',
                () => {
                    snsFeed = snsFeed.filter(p => p.id !== post.id);
                    saveFeed();
                    renderFeed(container, post.isStory ? 'story' : 'feed');
                    window.STLifeSimUI?.showSuccess?.('게시물을 삭제했습니다.');
                }
            );
        });
        
        actions.appendChild(likeBtn);
        actions.appendChild(commentBtn);
        actions.appendChild(deleteBtn);
        postEl.appendChild(actions);
        
        // 댓글 영역
        const commentsSection = document.createElement('div');
        commentsSection.className = 'stls-sns-comments';
        commentsSection.style.display = 'none';
        
        // 기존 댓글 표시
        post.comments.forEach(comment => {
            const commentEl = createCommentElement(comment);
            commentsSection.appendChild(commentEl);
        });
        
        // 댓글 입력
        const commentInput = document.createElement('div');
        commentInput.className = 'stls-sns-comment-input';
        commentInput.innerHTML = `
            <input type="text" class="stls-input" placeholder="댓글을 입력하세요..." style="flex: 1;">
            <button class="stls-btn stls-btn-primary">달기</button>
        `;
        
        commentInput.querySelector('button').addEventListener('click', async () => {
            const input = commentInput.querySelector('input');
            const text = input.value.trim();
            
            if (!text) return;
            
            // 유저 댓글 추가
            const newComment = {
                id: Date.now().toString(),
                author: 'user',
                text: text,
                date: new Date().toISOString(),
                replies: []
            };
            
            post.comments.push(newComment);
            saveFeed();
            
            // 채팅에 댓글 전송
            await window.STLifeSimSlash?.sendMessage?.(`[${post.authorName}의 게시물에 댓글] ${text}`);
            
            // AI 답글 생성 (NPC 게시물인 경우)
            if (!post.authorIsUser) {
                setTimeout(async () => {
                    const prompt = `${post.authorName}의 SNS 게시물에 {{user}}가 댓글을 달았다: "${text}". ${post.authorName}이 짧게 답글을 달아라.`;
                    await window.STLifeSimSlash?.generateAndSend?.(prompt, post.authorName);
                    
                    // 답글 추가 (플레이스홀더)
                    newComment.replies.push({
                        author: post.authorName,
                        text: '(생성된 답글)',
                        date: new Date().toISOString()
                    });
                    saveFeed();
                }, 2000);
            }
            
            input.value = '';
            renderFeed(container, post.isStory ? 'story' : 'feed');
        });
        
        commentsSection.appendChild(commentInput);
        postEl.appendChild(commentsSection);
        
        return postEl;
    }
    
    /**
     * 댓글 엘리먼트 생성
     */
    function createCommentElement(comment) {
        const commentEl = document.createElement('div');
        commentEl.className = 'stls-sns-comment';
        
        commentEl.innerHTML = `
            <span class="stls-sns-comment-author">${comment.author === 'user' ? '{{user}}' : comment.author}</span>
            <span class="stls-sns-comment-text">${comment.text}</span>
        `;
        
        // 답글 표시
        if (comment.replies && comment.replies.length > 0) {
            comment.replies.forEach(reply => {
                const replyEl = document.createElement('div');
                replyEl.className = 'stls-sns-reply';
                replyEl.innerHTML = `
                    <span class="stls-sns-comment-author">${reply.author}</span>
                    <span class="stls-sns-comment-text">${reply.text}</span>
                `;
                commentEl.appendChild(replyEl);
            });
        }
        
        return commentEl;
    }
    
    /**
     * 게시물 작성 다이얼로그
     */
    function showCreatePostDialog() {
        const content = document.createElement('div');
        content.innerHTML = `
            <div class="stls-form-group">
                <label class="stls-form-label">글 내용</label>
                <textarea class="stls-textarea" id="stls-post-content" placeholder="무슨 생각을 하고 계신가요?"></textarea>
            </div>
            <div class="stls-form-group">
                <label class="stls-form-label">이미지 URL (선택)</label>
                <input type="text" class="stls-input" id="stls-post-image">
            </div>
            <div class="stls-form-group">
                <label class="stls-form-label">게시물 타입</label>
                <div>
                    <label><input type="radio" name="postType" value="post" checked> 일반 게시물</label>
                    <label style="margin-left: 15px;"><input type="radio" name="postType" value="story"> 스토리</label>
                </div>
            </div>
        `;
        
        window.STLifeSimPopup?.createPopup?.({
            title: '✏️ 게시물 작성',
            content: content,
            buttons: [
                { text: '취소' },
                {
                    text: '올리기',
                    primary: true,
                    onClick: async () => {
                        const text = content.querySelector('#stls-post-content').value.trim();
                        const imageUrl = content.querySelector('#stls-post-image').value.trim();
                        const isStory = content.querySelector('input[name="postType"]:checked').value === 'story';
                        
                        if (!text) {
                            window.STLifeSimUI?.showError?.('내용을 입력해주세요.');
                            return;
                        }
                        
                        const userName = window.STLifeSimSlash?.getUserName?.() || '{{user}}';
                        
                        // 피드에 추가
                        snsFeed.unshift({
                            id: Date.now().toString(),
                            authorName: userName,
                            authorIsUser: true,
                            date: new Date().toISOString(),
                            content: text,
                            imageUrl: imageUrl,
                            likes: 0,
                            likedByUser: false,
                            comments: [],
                            isStory: isStory,
                            includeInContext: true
                        });
                        
                        saveFeed();
                        
                        // 채팅에 전송
                        await window.STLifeSimSlash?.sendMessage?.(`[SNS${isStory ? ' 스토리' : ''} 게시] ${text}`);
                        
                        window.STLifeSimUI?.showSuccess?.('게시물을 올렸습니다.');
                        showSNSPanel(); // 패널 새로고침
                    }
                }
            ]
        });
    }
    
    /**
     * 컨텍스트 생성
     */
    function getContext() {
        const contextPosts = snsFeed.filter(p => p.includeInContext && !p.isStory).slice(0, 5);
        
        if (contextPosts.length === 0) {
            return null;
        }
        
        let context = '=== 최근 SNS (컨텍스트 포함 설정 기준) ===\n';
        contextPosts.forEach(post => {
            const date = new Date(post.date);
            const dateStr = date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
            context += `• ${post.authorName}: "${post.content}" (${dateStr})\n`;
        });
        
        return context;
    }
    
    // 외부로 내보내기
    window.STLifeSimSNS = {
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
