# ST-LifeSim

**SillyTavern Life Simulation Extension** - A comprehensive life simulation extension for SillyTavern that adds social features, NPCs, calendar, wallet, and more to enhance your roleplay experience.

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 📋 목차 (Table of Contents)

- [개요 (Overview)](#개요-overview)
- [주요 기능 (Key Features)](#주요-기능-key-features)
- [설치 방법 (Installation)](#설치-방법-installation)
- [모듈 상세 (Module Details)](#모듈-상세-module-details)
- [사용 방법 (Usage Guide)](#사용-방법-usage-guide)
- [개발 원칙 (Development Principles)](#개발-원칙-development-principles)
- [기술 스택 (Tech Stack)](#기술-스택-tech-stack)
- [기여하기 (Contributing)](#기여하기-contributing)
- [라이선스 (License)](#라이선스-license)

---

## 개요 (Overview)

ST-LifeSim은 SillyTavern용 확장 프로그램으로, 롤플레이에 생활 시뮬레이션 요소를 추가합니다. NPC 연락처, 일정 관리, SNS 피드, 통화 시스템, 가상 화폐 등 다양한 모듈을 통해 더욱 풍부하고 입체적인 대화 경험을 제공합니다.

### 핵심 설계 철학

- **모듈화**: 각 기능은 독립적으로 동작하며 ON/OFF 가능
- **컨텍스트 주입**: World Info 대신 프롬프트 직접 주입 방식 사용
- **바인딩 시스템**: 채팅별 또는 캐릭터별 데이터 저장 선택 가능
- **한국어 주석**: 모든 코드에 초등학생도 이해할 수 있는 한국어 주석 포함

---

## 주요 기능 (Key Features)

### ✨ 모바일 친화적 디자인 (Mobile-Friendly Design)
- **반응형 UI**: 모든 화면 크기에 최적화된 인터페이스
- **터치 지원**: 터치 디바이스에서 완벽하게 작동하는 제스처 및 버튼
- **플로팅 메뉴**: 드래그 가능한 원형 플로팅 버튼으로 모든 기능에 빠르게 접근
- **iMessage 스타일**: 부드러운 그라데이션과 애니메이션이 적용된 세련된 디자인

### 🛠️ 퀵 도구 모음 (Quick Tools)
- **퀵센드**: AI 응답 없이 메시지 전송 (Ctrl+Shift+Enter 또는 send form 버튼)
- **시간 구분선**: 30분 후, 1시간 후, 다음날 등 시간 경과 표시
- **읽씹 연출**: 읽음 표시 후 AI가 읽씹 상황 묘사
- **연락 안됨**: 연결 불가 상황 연출
- **사건 생성기**: 일상, 직장, 관계, 사고 등 7가지 카테고리의 랜덤 이벤트
- **음성메모**: 음성 메시지 연출 (길이 및 내용 힌트 설정 가능)
- **사건 기록**: 생성된 사건들을 아카이브하고 컨텍스트 포함 여부 설정

### 😊 이모티콘 (Emoticon)
- 이미지 URL 기반 커스텀 이모티콘 시스템
- 카테고리별 분류 및 즐겨찾기 기능
- AI 사용 가능/불가 구분
- 검색 기능
- AI 공용 이모티콘은 자동으로 컨텍스트에 주입

### 📋 NPC 연락처 (Contacts)
- 주변 인물 프로필 관리 (이름, 이미지, 관계, 성격 등)
- {{user}} 및 {{char}}와의 관계 정보 저장
- 태그 시스템으로 분류
- 채팅별/캐릭터별 저장 방식 선택
- 등록된 인물 정보는 자동으로 컨텍스트에 주입

### 💰 지갑 & 송금 (Wallet)
- 커스텀 화폐 설정 (이름, 기호 자유 변경)
- 잔액 충전/차감 기능
- 송금 시스템 (채팅에 송금 영수증 자동 표시)
- 거래 내역 관리
- 현재 잔액 정보는 컨텍스트에 주입

### 📅 캘린더 (Calendar)
- 1~30일 순환 시스템 (현실 날짜 사용 안 함)
- 수동 날짜 진행 (◀▶ 버튼으로 조절)
- 일정 추가/편집/삭제
- 일정 완료 체크
- 연락처 연동
- 다가오는 일정은 자동으로 컨텍스트에 주입

### 📸 SNS 피드 (Social Feed)
- 유저가 직접 게시물 작성 가능
- AI가 자동으로 NPC 포스팅 (AI 응답 완료 시 20% 확률)
- {{char}} 및 등록된 연락처 인물들이 랜덤 포스팅
- 좋아요 기능
- 댓글 달기 → AI가 해당 NPC 이름으로 답글 생성
- 최근 포스팅은 컨텍스트에 주입

### 📞 통화 & 통화기록 (Call)
- AI 응답에서 통화 키워드 자동 감지
- 통화 시작/종료 마커 자동 삽입
- 실시간 통화 시간 표시
- 통화 구간을 기록으로 저장
- 통화기록별 컨텍스트 포함 여부 설정
- 감지 키워드 커스터마이징 가능

---

## 설치 방법 (Installation)

### 필수 조건
- SillyTavern 1.10.0 이상

### 설치 단계

1. **SillyTavern 확장 폴더로 이동**
   ```bash
   cd [SillyTavern 설치 경로]/public/scripts/extensions/third-party
   ```

2. **레포지토리 클론**
   ```bash
   git clone https://github.com/gulggu/STP.git st-lifesim
   ```

3. **SillyTavern 재시작**

4. **확장 활성화 확인**
   - SillyTavern 설정 → Extensions → ST-LifeSim 활성화 확인

---

## 모듈 상세 (Module Details)

### 프로젝트 구조

```
st-lifesim/
├── index.js                  # 진입점, 모듈 로드
├── manifest.json             # 확장 메타정보
├── style.css                 # 공통 스타일
├── settings.js               # 설정 UI
│
├── modules/
│   ├── emoticon/            # 이모티콘 모듈
│   ├── contacts/            # 연락처 모듈
│   ├── quick-tools/         # 퀵 도구 모듈
│   ├── call/                # 통화 모듈
│   ├── wallet/              # 지갑 모듈
│   ├── sns/                 # SNS 모듈
│   └── calendar/            # 캘린더 모듈
│
└── utils/
    ├── storage.js           # 저장소 관리
    ├── context-inject.js    # 컨텍스트 주입
    ├── slash.js             # 슬래시 커맨드 래퍼
    ├── popup.js             # 팝업 컴포넌트
    ├── floating-menu.js     # 플로팅 메뉴 시스템
    └── ui.js                # UI 유틸리티
```

### 플로팅 메뉴 사용법 (Floating Menu Usage)

화면 우측 하단에 나타나는 원형 버튼을 통해 모든 기능에 접근할 수 있습니다:

1. **플로팅 버튼 클릭**: 메뉴 확장/축소
2. **드래그**: 버튼을 드래그하여 원하는 위치로 이동
3. **메뉴 아이템**: 각 아이콘을 클릭하여 해당 모듈 열기
   - 🛠️ 퀵 도구 (시간 구분선, 읽씹, 사건 생성 등)
   - 😊 이모티콘
   - 📋 연락처
   - 💰 지갑
   - 📅 캘린더
   - 📸 SNS
   - 📞 통화
   - ⚙️ 설정

### 퀵센드 기능 (Quick Send Feature)

메시지 전송 버튼 옆에 있는 "📨 퀵센드" 버튼을 사용하면:
- 입력한 메시지 앞에 `/send` 명령어가 자동으로 추가됨
- AI 응답 없이 메시지만 채팅창에 추가됨
- 단축키: `Ctrl + Shift + Enter`

### 슬래시 커맨드 사용 규칙

```javascript
// 유저 말풍선으로 보낼 때 (AI 응답 없음)
/send 텍스트

// {{char}} 말풍선으로 보낼 때 (AI 응답 없이 바로)
/sendas name="{{char}}" 텍스트

// {{char}} 이름으로 AI가 내용을 생성하게 할 때
/gen (생성할 내용 프롬프트) | /sendas name="{{char}}"

// 시스템 알림
/echo 텍스트
```

### 컨텍스트 주입 시스템

모든 모듈 정보를 하나의 블록으로 통합하여 매 턴 주입:

```
[ST-LifeSim 컨텍스트]

=== 주변 인물 ===
• 홍길동 | {{user}}의 소꿉친구 | 유쾌하고 털털함
• 김영희 | {{user}}의 직장 상사 | 꼼꼼하고 냉정함

=== 지갑 (골드 G) ===
현재 잔액: G 1,250,000

=== 일정 ===
오늘(15일): 홍길동과 점심 (12:00, 강남역)
D+3(18일): {{char}}와 영화

=== 최근 SNS ===
• 홍길동: "오늘도 커피로 시작 ☕" (15일)

=== AI 사용 가능 이모티콘 ===
• 하트: ![하트](url) | 놀람: ![놀람](url)

[/ST-LifeSim 컨텍스트]
```

---

## 사용 방법 (Usage Guide)

### 첫 실행

1. SillyTavern 우측 상단 Extensions 버튼 클릭
2. "ST-LifeSim 설정" 메뉴 선택
3. 원하는 모듈 활성화/비활성화
4. 채팅창 상단에 툴바가 표시됨

### 퀵 도구 사용

채팅창 상단 툴바에서 각 버튼 클릭:
- 📨 퀵센드: 입력창 메시지를 AI 응답 없이 전송
- ⏱️ 구분선: 시간 경과 표시 선택
- 👻 읽씹: 읽음 표시 + AI 묘사
- 📵 연락안됨: 연결 불가 연출
- ⚡ 사건생성: 카테고리 선택하여 랜덤 이벤트 생성
- 🎤 음성메모: 음성 메시지 연출
- 📜 사건기록: 생성된 사건 목록 보기

### 이모티콘 추가

1. 툴바에서 😊 이모티콘 버튼 클릭
2. "+ 이모티콘 추가" 클릭
3. 이미지 URL, 이름, 카테고리 입력
4. AI 사용 가능 여부 선택
5. 저장

### NPC 연락처 등록

1. 툴바에서 📋 연락처 버튼 클릭
2. "+ 새 연락처" 클릭
3. 이름, 관계, 성격 등 정보 입력
4. 저장 방식 선택 (이 채팅 / 이 캐릭터)
5. 저장

### 송금하기

1. 툴바에서 💰 지갑 버튼 클릭
2. 받는 사람, 금액, 메모 입력
3. "송금 확인" 클릭
4. 채팅창에 영수증 자동 표시

### 일정 추가

1. 툴바에서 📅 캘린더 버튼 클릭
2. ◀▶ 버튼으로 오늘 날짜 설정
3. "+ 일정 추가" 클릭
4. 날짜, 시간, 제목, 내용 입력
5. 저장

### SNS 포스팅

**유저 직접 올리기:**
1. 툴바에서 📸 SNS 버튼 클릭
2. "✏️ 직접 올리기" 클릭
3. 글 내용 작성 (이미지 URL 선택)
4. "올리기" 클릭

**NPC 랜덤 포스팅:**
- AI 응답 완료 시 20% 확률로 자동 발동
- 또는 "🎲 NPC 포스팅" 버튼으로 수동 발동

### 통화하기

**자동 감지:**
- AI가 "전화할게", "통화하자" 등의 키워드 포함 시 자동으로 통화 시작 알림

**수동 종료:**
1. 우측 상단 통화 바의 "종료" 버튼 클릭
2. 또는 툴바의 "📵 통화 종료" 버튼 클릭
3. 통화 기록 저장 여부 선택

---

## 개발 원칙 (Development Principles)

| 원칙 | 세부 사항 |
|------|-----------|
| **모듈화** | 각 기능은 독립된 모듈. 하나를 꺼도 다른 기능에 영향 없음 |
| **유지보수성** | 공통 유틸 함수 철저히 분리 |
| **주석** | 초등학생도 이해할 수 있도록 모든 함수/로직에 한국어 주석 필수 |
| **ON/OFF** | 확장 전체 + 모듈별 개별 활성화/비활성화 |
| **바인딩** | 채팅별 기본 / 캐릭터별 선택 (항목 단위 전환 가능) |

---

## 기술 스택 (Tech Stack)

- **JavaScript (ES6+)**: 모듈 시스템, async/await
- **CSS3**: Flexbox, Grid, Animations
- **SillyTavern API**: 슬래시 커맨드, 컨텍스트 주입, 이벤트 시스템

---

## 기여하기 (Contributing)

기여는 언제나 환영합니다!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### 코드 스타일

- 모든 함수에 JSDoc 주석 작성
- 한국어 주석 우선 (영어 주석도 환영)
- 들여쓰기: 스페이스 4칸
- 파일명: kebab-case

---

## 로드맵 (Roadmap)

### v0.2.0 (예정)
- [ ] 위치 기반 시스템 (집, 학교, 직장 등)
- [ ] 친밀도 시스템
- [ ] 미션/퀘스트 시스템

### v0.3.0 (예정)
- [ ] 미니게임 (주사위, 가위바위보 등)
- [ ] 스탯 시스템
- [ ] 인벤토리 시스템

---

## 라이선스 (License)

MIT License

Copyright (c) 2024 gulggu

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## 문의 및 지원 (Support)

- **Issues**: [GitHub Issues](https://github.com/gulggu/STP/issues)
- **Discussions**: [GitHub Discussions](https://github.com/gulggu/STP/discussions)

---

## 감사의 말 (Acknowledgments)

- SillyTavern 팀 및 커뮤니티
- 모든 테스터 및 기여자분들

---

**Made with ❤️ for the SillyTavern community**