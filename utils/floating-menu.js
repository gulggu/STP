/* ============================================================================
 * floating-menu.js - 플로팅 메뉴 시스템
 * ============================================================================
 * 드래그 가능한 원형 플로팅 버튼과 확장 가능한 서브메뉴
 * 모바일 친화적이며 터치 이벤트 지원
 * ========================================================================== */

let floatingMenu = null;
let mainButton = null;
let submenu = null;
let isExpanded = false;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let menuStartX = 0;
let menuStartY = 0;

/**
 * 플로팅 메뉴 초기화
 * @param {Array} menuItems - 메뉴 아이템 배열 [{icon, label, onClick}, ...]
 */
export function initFloatingMenu(menuItems = []) {
    // 기존 메뉴 제거
    if (floatingMenu) {
        floatingMenu.remove();
    }
    
    // 메뉴 컨테이너 생성
    floatingMenu = document.createElement('div');
    floatingMenu.className = 'stls-floating-menu';
    
    // 메인 버튼 생성
    mainButton = document.createElement('button');
    mainButton.className = 'stls-floating-main-btn';
    mainButton.innerHTML = '🛠️';
    mainButton.title = 'ST-LifeSim 메뉴';
    
    // 서브메뉴 생성
    submenu = document.createElement('div');
    submenu.className = 'stls-floating-submenu';
    
    // 메뉴 아이템 추가
    menuItems.forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'stls-floating-submenu-btn';
        btn.innerHTML = item.icon;
        btn.title = item.label;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (item.onClick) {
                item.onClick();
            }
            // 메뉴 닫기
            closeMenu();
        });
        submenu.appendChild(btn);
    });
    
    floatingMenu.appendChild(submenu);
    floatingMenu.appendChild(mainButton);
    document.body.appendChild(floatingMenu);
    
    // 이벤트 리스너 등록
    setupEventListeners();
    
    // 저장된 위치 복원
    restorePosition();
    
    return floatingMenu;
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners() {
    // 마우스 이벤트
    mainButton.addEventListener('mousedown', handleDragStart);
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    
    // 터치 이벤트
    mainButton.addEventListener('touchstart', handleDragStart, { passive: false });
    document.addEventListener('touchmove', handleDragMove, { passive: false });
    document.addEventListener('touchend', handleDragEnd);
    
    // 클릭 이벤트 (드래그가 아닐 때만)
    mainButton.addEventListener('click', handleClick);
    
    // 외부 클릭으로 메뉴 닫기
    document.addEventListener('click', (e) => {
        if (isExpanded && !floatingMenu.contains(e.target)) {
            closeMenu();
        }
    });
}

/**
 * 드래그 시작
 */
function handleDragStart(e) {
    isDragging = false;
    
    const touch = e.type === 'touchstart' ? e.touches[0] : e;
    dragStartX = touch.clientX;
    dragStartY = touch.clientY;
    
    const rect = floatingMenu.getBoundingClientRect();
    menuStartX = rect.left;
    menuStartY = rect.top;
    
    floatingMenu.classList.add('dragging');
    
    if (e.type === 'touchstart') {
        e.preventDefault();
    }
}

/**
 * 드래그 중
 */
function handleDragMove(e) {
    if (dragStartX === 0 && dragStartY === 0) return;
    
    const touch = e.type === 'touchmove' ? e.touches[0] : e;
    const deltaX = touch.clientX - dragStartX;
    const deltaY = touch.clientY - dragStartY;
    
    // 드래그 감지 (5px 이상 이동 시)
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        isDragging = true;
    }
    
    if (isDragging) {
        const newX = menuStartX + deltaX;
        const newY = menuStartY + deltaY;
        
        // 화면 경계 제한
        const maxX = window.innerWidth - floatingMenu.offsetWidth;
        const maxY = window.innerHeight - floatingMenu.offsetHeight;
        
        const clampedX = Math.max(0, Math.min(newX, maxX));
        const clampedY = Math.max(0, Math.min(newY, maxY));
        
        floatingMenu.style.left = clampedX + 'px';
        floatingMenu.style.top = clampedY + 'px';
        floatingMenu.style.right = 'auto';
        floatingMenu.style.bottom = 'auto';
        
        if (e.type === 'touchmove') {
            e.preventDefault();
        }
    }
}

/**
 * 드래그 종료
 */
function handleDragEnd(e) {
    if (isDragging) {
        // 위치 저장
        savePosition();
    }
    
    floatingMenu.classList.remove('dragging');
    
    // 클릭 이벤트가 발생하지 않도록 약간의 지연
    setTimeout(() => {
        dragStartX = 0;
        dragStartY = 0;
        isDragging = false;
    }, 100);
}

/**
 * 클릭 핸들러 (드래그가 아닐 때만)
 */
function handleClick(e) {
    if (!isDragging) {
        toggleMenu();
    }
    e.stopPropagation();
}

/**
 * 메뉴 토글
 */
export function toggleMenu() {
    if (isExpanded) {
        closeMenu();
    } else {
        openMenu();
    }
}

/**
 * 메뉴 열기
 */
export function openMenu() {
    isExpanded = true;
    mainButton.classList.add('expanded');
    mainButton.innerHTML = '✕';
    submenu.classList.add('show');
}

/**
 * 메뉴 닫기
 */
export function closeMenu() {
    isExpanded = false;
    mainButton.classList.remove('expanded');
    mainButton.innerHTML = '🛠️';
    submenu.classList.remove('show');
}

/**
 * 위치 저장
 */
function savePosition() {
    const rect = floatingMenu.getBoundingClientRect();
    localStorage.setItem('stls-floating-menu-position', JSON.stringify({
        left: rect.left,
        top: rect.top
    }));
}

/**
 * 위치 복원
 */
function restorePosition() {
    const saved = localStorage.getItem('stls-floating-menu-position');
    if (saved) {
        try {
            const pos = JSON.parse(saved);
            floatingMenu.style.left = pos.left + 'px';
            floatingMenu.style.top = pos.top + 'px';
            floatingMenu.style.right = 'auto';
            floatingMenu.style.bottom = 'auto';
        } catch (e) {
            console.warn('[FloatingMenu] 저장된 위치 복원 실패:', e);
        }
    }
}

/**
 * 플로팅 메뉴 제거
 */
export function destroyFloatingMenu() {
    if (floatingMenu) {
        floatingMenu.remove();
        floatingMenu = null;
        mainButton = null;
        submenu = null;
    }
}

/**
 * 메뉴 아이템 업데이트
 * @param {Array} menuItems - 새로운 메뉴 아이템 배열
 */
export function updateMenuItems(menuItems) {
    if (!submenu) return;
    
    // 기존 아이템 제거
    submenu.innerHTML = '';
    
    // 새 아이템 추가
    menuItems.forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'stls-floating-submenu-btn';
        btn.innerHTML = item.icon;
        btn.title = item.label;
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (item.onClick) {
                item.onClick();
            }
            closeMenu();
        });
        submenu.appendChild(btn);
    });
}

export default {
    initFloatingMenu,
    toggleMenu,
    openMenu,
    closeMenu,
    destroyFloatingMenu,
    updateMenuItems
};
