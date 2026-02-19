# ST-LifeSim Development Guide

이 문서는 ST-LifeSim 확장 프로그램의 개발 가이드입니다.

## 📦 완료된 작업 (Phase 1-2)

### Phase 1: 기반 구조 ✅
- ✅ 확장 프로그램 기본 구조 (manifest.json, index.js)
- ✅ 공통 스타일시트 (style.css)
- ✅ 설정 시스템 (settings.js)
- ✅ 5개의 핵심 유틸리티:
  - `utils/storage.js` - 채팅별/캐릭터별 데이터 저장
  - `utils/slash.js` - 슬래시 커맨드 래퍼
  - `utils/popup.js` - 팝업 시스템
  - `utils/context-inject.js` - 컨텍스트 주입
  - `utils/ui.js` - 공통 UI 컴포넌트

### Phase 2: 핵심 입력 도구 ✅
- ✅ **퀵 도구 모듈** (`modules/quick-tools/`)
  - 6가지 기능 구현 완료
  - 툴바 UI 통합
  - 사건 기록 아카이브
  - 단축키 지원
  
- ✅ **이모티콘 모듈** (`modules/emoticon/`)
  - 완전한 CRUD 기능
  - 카테고리 및 즐겨찾기
  - 검색 기능
  - AI 사용 구분
  - 컨텍스트 주입 통합

## 🔜 다음 단계 (Phase 3-5)

### Phase 3: 데이터 모듈
다음으로 구현할 모듈들:

1. **NPC 연락처** (`modules/contacts/`)
   - 파일: `contacts.js`, `contacts.css`
   - 주요 기능:
     - NPC 등록/편집/삭제
     - 관계 정보 관리
     - 프로필 이미지
     - 태그 시스템
     - 컨텍스트 주입

2. **지갑 & 송금** (`modules/wallet/`)
   - 파일: `wallet.js`, `wallet.css`
   - 주요 기능:
     - 커스텀 화폐 설정
     - 잔액 관리
     - 송금 기능
     - 거래 내역
     - 송금 메시지 자동 생성

3. **캘린더** (`modules/calendar/`)
   - 파일: `calendar.js`, `calendar.css`
   - 주요 기능:
     - 1-30일 순환 시스템
     - 일정 추가/편집
     - D+N 표시
     - 컨텍스트 주입

### Phase 4: 소셜 & 고급
1. **SNS 피드** (`modules/sns/`)
   - 랜덤 NPC 포스팅
   - 댓글/답글 시스템
   - 좋아요 기능
   - 스토리 기능

2. **통화 & 통화기록** (`modules/call/`)
   - 자동 통화 감지
   - 통화 마커 삽입
   - 통화 기록 아카이브
   - 부재중 전화

### Phase 5: 폴리시
- 컨텍스트 토큰 최적화
- 데이터 백업/복원
- 완전한 문서화
- 모든 코드에 한국어 주석

## 🏗️ 아키텍처 설명

### 모듈 구조
```
각 모듈은 독립적으로 작동:
- {module}.js: 핵심 로직
- {module}.css: 스타일
- 전역 객체 노출: window.lifesim{Module}
```

### 데이터 흐름
```
1. 사용자 입력
   ↓
2. 모듈 함수 호출
   ↓
3. utils/storage.js로 저장
   ↓
4. utils/context-inject.js로 컨텍스트 생성
   ↓
5. SillyTavern으로 전송
```

### 설정 시스템
```javascript
// 전역 상태
window.lifesim.state = {
    enabled: true,
    modules: {
        emoticon: { enabled: true },
        // ...
    }
}

// 설정 저장
await saveSettings(settings);

// 설정 불러오기
const settings = await loadSettings();
```

### 팝업 시스템
```javascript
// 기본 팝업
createPopup({
    title: '제목',
    content: '내용',
    buttons: [...]
});

// 탭 팝업
createTabbedPopup({
    title: '제목',
    tabs: [...],
    width: '700px'
});
```

### 슬래시 커맨드
```javascript
// 메시지 전송
await sendMessage(text);

// 캐릭터로 전송
await sendAsCharacter(name, text);

// AI 생성
await generateAndSendAs(name, prompt);
```

## 🎨 스타일 가이드

### CSS 클래스 네이밍
```css
.lifesim-{component}-{element}
.lifesim-{component}-{element}-{modifier}

예시:
.lifesim-popup-header
.lifesim-btn-primary
.lifesim-emoticon-item
```

### 색상 변수
```css
var(--SmartThemeBodyColor, #1a1a1a)      /* 배경색 */
var(--SmartThemeBorderColor, #333)       /* 테두리 */
var(--SmartThemeBodyText, #e0e0e0)       /* 텍스트 */
var(--SmartThemeQuoteColor, #4a9eff)     /* 강조색 */
```

## 📝 코딩 컨벤션

### JavaScript
```javascript
/**
 * JSDoc 형식 주석 (한국어)
 * @param {string} name - 파라미터 설명
 * @returns {boolean} 반환값 설명
 */
function functionName(name) {
    // 들여쓰기: 스페이스 4칸
    // 세미콜론 사용
    // camelCase 사용
}
```

### 파일 구조
```javascript
// 1. Import 문
import { ... } from '...';

// 2. 상수 및 변수
const CONSTANT = 'value';
let variable = 'value';

// 3. Export 함수
export function mainFunction() {
    // ...
}

// 4. 내부 함수
function helperFunction() {
    // ...
}

// 5. 유틸리티
function generateId() {
    // ...
}
```

## 🧪 테스트 가이드

### 수동 테스트 체크리스트

**퀵 도구:**
- [ ] 퀵 센드 작동 확인
- [ ] 구분선 삽입 확인
- [ ] 읽씹 연출 실행 확인
- [ ] 연락 안 됨 연출 확인
- [ ] 사건 생성 7가지 카테고리 확인
- [ ] 사건 기록 저장 및 열람 확인
- [ ] 음성메모 삽입 확인

**이모티콘:**
- [ ] 팝업 열기/닫기
- [ ] 이모티콘 추가
- [ ] 이모티콘 편집
- [ ] 이모티콘 삭제
- [ ] 즐겨찾기 추가/해제
- [ ] 검색 기능
- [ ] 이모티콘 전송
- [ ] 카테고리 분류
- [ ] AI 사용 구분
- [ ] 바인딩 변경 (채팅/캐릭터)

### 브라우저 콘솔 확인
```javascript
// 확장 로드 확인
window.lifesim

// 모듈 상태 확인
window.lifesim.state

// 이모티콘 데이터 확인
window.lifesimEmoticon.getAIUsableEmoticons()
```

## 🐛 디버깅 팁

### 콘솔 로그 확인
모든 모듈은 초기화 시 로그를 출력합니다:
```
[ST-LifeSim] Extension initialized successfully
[ST-LifeSim Quick Tools] Initialized successfully
[ST-LifeSim Emoticon] Initialized successfully
```

### 일반적인 문제

1. **모듈이 로드되지 않음**
   - `index.js`에서 import 확인
   - manifest.json 확인
   - 브라우저 콘솔 에러 확인

2. **CSS가 적용되지 않음**
   - CSS 파일 경로 확인
   - 브라우저 캐시 클리어

3. **데이터가 저장되지 않음**
   - localStorage 권한 확인
   - 바인딩 설정 확인

4. **슬래시 커맨드가 작동하지 않음**
   - SillyTavern API 버전 확인
   - executeSlashCommands 함수 확인

## 📚 참고 자료

### SillyTavern API
- 확장 개발 가이드: [SillyTavern Docs](https://docs.sillytavern.app/)
- 슬래시 커맨드: [Slash Commands](https://docs.sillytavern.app/usage/core-settings/slash-commands/)

### 프로젝트 파일
- `README.md`: 사용자 문서
- `DEVELOPMENT.md`: 이 파일 (개발 가이드)
- `manifest.json`: 확장 메타데이터

## 🤝 기여하기

새로운 모듈을 추가하려면:

1. `modules/{module-name}/` 폴더 생성
2. `{module-name}.js` 파일 생성
3. `{module-name}.css` 파일 생성
4. `index.js`에 import 추가
5. 초기화 함수 호출 추가
6. README 업데이트

## 📞 문의

질문이나 제안사항은 GitHub Issues를 이용해주세요.
