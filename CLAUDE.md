# 쌤chat — Claude 세션 핸드오프 문서

## 프로젝트 한 줄 요약
유치원·어린이집 선생님을 위한 **AI 기반 기록 자동화 PWA**. 알림장·관찰일지·학부모 답변·놀이기록·성장 리포트 5가지 도구. 본인 API 키로 Claude / OpenAI / Gemini 중 선택.

배포: https://aisam.vercel.app (main 브랜치)
프리뷰: PR #2 (현재 작업 중인 브랜치)

## 현재 상태 (이 문서 작성 시점)
- **작업 브랜치**: `claude/improve-kindergarten-app-design-FAmvi`
- **PR**: #2 (https://github.com/aslrud73/aisam/pull/2) — main에 머지 대기 중
- **본인 도메인**: aisam.vercel.app (main에서 자동 배포)
- main에 머지하기 전에 디자인 교체 작업을 PR #2 위에서 계속할 예정

## 다음 작업: 디자인 교체
- 사용자가 새 디자인 레퍼런스(Figma·스크린샷·참고 사이트)를 직접 제공할 예정
- 토큰 시스템(`tailwind.config.ts`, `app/globals.css`)부터 갈아엎거나 점진적으로 교체할지 사용자와 합의 후 진행
- 기존 디자인 시스템과의 호환성 유지 여부 사용자에게 먼저 확인할 것

## 기술 스택
- **Next.js 14.2** (app router)
- **TypeScript**, **React 18**
- **Tailwind CSS 3.4** — 커스텀 토큰만 사용, 외부 UI 라이브러리 없음
- **Dexie 4** (IndexedDB) — 모든 사용자 데이터는 브라우저에만 저장
- **AI SDKs**: `@anthropic-ai/sdk`, `openai`, `@google/genai` — BYO API 키

## 핵심 디렉토리 맵

```
app/
├── layout.tsx              # RootLayout, metadata, viewport, themeColor
├── globals.css             # Tailwind + Pretendard/Gowun Dodum 폰트 임포트
├── page.tsx                # / "오늘 기록" — 알림장/관찰일지 작성
├── parent/page.tsx         # /parent "학부모 답변"
├── play/page.tsx           # /play "놀이기록"
├── reports/page.tsx        # /reports "성장 리포트" (월/학기/년)
├── settings/page.tsx       # /settings — API 키, 모델, 데이터 관리
├── help/page.tsx           # /help "사용 설명서" — 9개 섹션 + FAQ
├── manifest.ts             # PWA 매니페스트
├── icon.tsx, apple-icon.tsx # 동적 favicon (Next.js ImageResponse)
├── components/
│   ├── TopNav.tsx          # 상단 네비
│   ├── Footer.tsx          # 사이트 전역 푸터 (꼬마나라 AI 티처랩)
│   ├── Icon.tsx            # SVG 라인 아이콘 단일 컴포넌트 (모든 아이콘 정의)
│   ├── SetupBanner.tsx     # API 키 미설정 시 노출되는 온보딩 배너
│   ├── DataSection.tsx     # 설정 페이지의 백업/복원 위젯
│   └── HistorySection.tsx  # 학부모/놀이/성장 리포트 히스토리 공용 컴포넌트
├── api/
│   ├── generate/route.ts   # 알림장·관찰일지 생성 (가장 복잡한 프롬프트)
│   ├── parent/route.ts     # 학부모 답변
│   ├── play/route.ts       # 놀이기록 (Vision)
│   └── report/route.ts     # 성장 리포트 (기간 종합)
└── lib/
    ├── db.ts               # Dexie 스키마, 모든 DB 헬퍼, 백업/복원
    ├── settings.ts         # API 키·모델 localStorage 관리
    ├── koreanName.ts       # 한국어 성·이름 분리, 받침에 따른 조사 처리
    └── providers/          # Claude/OpenAI/Gemini 어댑터
        ├── types.ts        # PROVIDER_LABELS, MODEL_CHOICES, DEFAULT_MODELS
        └── ...
public/
├── icon.svg                # 메인 SVG 아이콘 ("쌤" 글자, 테라코타)
└── icon-maskable.svg       # PWA maskable
```

## 디자인 시스템 (현재)
색상은 `tailwind.config.ts`에 토큰으로 정의돼있고 모든 페이지가 이걸 사용함. 디자인 교체 시 토큰 우선 갈면 자연스럽게 전체 반영됨.

- **cream**: 배경 (`#FBF7F0`)
- **paper**: 카드 (`#FFFFFF`)
- **ink** (`#2A2620`) / soft / muted / faint: 텍스트 그라디언트
- **warm** 50/100/200/300/400: 따뜻한 그레이 (보더, 배경)
- **terracotta** 50~800: 메인 강조색 (`DEFAULT: #C56B4A`)
- **sage** 50~600: 보조 강조색 (`DEFAULT: #7A9479`)
- 그림자 토큰: `shadow-card`, `shadow-card-hover`, `shadow-soft`

폰트:
- **Pretendard** ExtraBold (브랜드 워드마크 "쌤chat")
- **Pretendard** 400/500/600 (본문)
- **Gowun Dodum** (`font-display`) — 빈 상태 메시지·강조에만 한정 사용

## 핵심 컴포넌트 패턴

### `<StepHeader>` (오늘 기록 페이지)
번호 뱃지 + 아이콘 + 제목 + 우측 액션 슬롯. 다른 페이지엔 인라인 `<Step>` 비슷한 패턴.

### `<HistorySection>` (재사용)
각 도구 페이지 하단의 "지난 기록" 펼침 리스트. props: `title`, `emptyMessage`, `load` (async), `onDelete`, `headerRight`(optional). 새 기록 저장 후 부모가 `key={...-${historyVersion}}`로 강제 리마운트해서 즉시 갱신.

### CTA 버튼 표준
- **Primary**: `bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-2xl shadow-sm`
- **Secondary**: `bg-paper border border-warm-200 text-ink-soft`
- **Dark inverse** (전체 복사 등): `bg-ink hover:bg-ink-soft text-cream`
- **Sage** (보조 액션, 출석체크 등): `bg-sage-500 hover:bg-sage-600 text-white`

## AI 프롬프트 구조 (중요)

### `app/api/generate/route.ts` — 알림장 vs 관찰일지
이 둘은 **완전히 다른 모드**로 작동하도록 시스템 프롬프트가 강력히 분리돼있음. 절대 합치지 말 것.

- **알림장**: 학부모께 카톡으로 보내는 짧은 일기체. 누리과정 영역 언급·분석체 종결·헤더 절대 금지. 마무리는 학부모께 직접 (예: "오늘 푹 쉬게 해주세요"). "바라요" 류 어색한 표현 금지.
- **관찰일지**: 교사 본인·교육청 제출용 공식 기록. 출력에 `[관찰 상황]` `[발달적 의미]` `[교사 지원 방향]` 세 섹션 헤더 **반드시 포함**. 학부모 호칭·인사말 절대 금지.

### 공통 규칙 (`NAME_RULE`, `SAFETY_GUIDELINES`)
- 호칭: 풀네임이 아니라 **given name**만 (예: "민선이는…"). 받침 유무에 따라 조사 자동 변환. `app/lib/koreanName.ts` 참조.
- 다른 아이 이름 노출 금지 → "또래/친구"로 자동 통칭.
- 진단·평가·낙인 표현 금지 ("공격성", "발달 지연" 등) → 부드러운 대체 표현 강제.
- 의료적 진단 추측 금지.
- 이모지·특수문자 금지.

## 데이터 (IndexedDB v2)
모든 데이터는 브라우저 IndexedDB에만 저장. 서버는 AI 호출 중계만 함.

테이블:
- **dailyEntries**: 알림장·관찰일지 (kidId+date 인덱스)
- **parentReplies**: 학부모 답변
- **playJournals**: 놀이기록 (사진 썸네일 포함, 백업 시 옵션)
- **growthReports**: 성장 리포트 (v2에서 추가)

`exportAll`/`importAll`은 v1 백업도 호환.

## 브랜드/카피 규칙
- 앱 이름: **쌤chat** (소문자 chat)
- 카피라이트: `© 꼬마나라 AI 티처랩. All rights reserved.` (Footer.tsx)
- 카피 톤: 한국 유치원 교사 대상, 따뜻하지만 전문적. 비기술 사용자 친화 (API → "AI 회사에서 받는 비밀번호" 식으로 풀어 설명).
- 이모지: 사용자가 명시적으로 요청하지 않는 한 사용 안 함.

## Korean particle handling
`app/lib/koreanName.ts` — 한국 학부모/유치원 도메인이라 무시 못 하는 디테일.
- `getGivenName(fullName)`: 1자 성 + 복성 리스트 처리해서 given name 반환
- `particleHint(givenName)`: 받침 유무로 조사 힌트 반환 (모델에게 전달)

## 명단(roster) 관리 (page.tsx)
- 출석 체크 토글 (sage 단추)
- "명단 수정" 모드: 인라인 이름 수정 + 졸업/이동 + 삭제
- "졸업/이동한 아이들" 별도 펼침 섹션 (누적 기록은 보존)
- 이름 변경 시 `renameKid()`로 dailyEntries + growthReports의 kidName 동기화
- 명단 .txt 내보내기/가져오기 지원
- 마지막 활동일 표시 (최근 N일 전 / 날짜)

## 빌드/배포
```bash
npm install
npm run dev      # localhost:3000
npm run build    # 프로덕션 빌드 (변경 후 항상 통과 확인)
```
Vercel은 푸시할 때마다 PR #2의 프리뷰 URL 자동 갱신.

## 작업 시 지킬 컨벤션
1. **변경 후 `npm run build` 통과 확인** 후 커밋.
2. 커밋은 논리적 단위로 분리. 메시지는 영어, 본문은 변경 의도 + 사용자 시나리오.
3. 사용자에게 변경 요약은 한국어로 (코드 주석은 영어).
4. 디자인 변경 시 토큰부터 (`tailwind.config.ts` → `globals.css` → 컴포넌트 → 페이지 순서로 cascade).
5. AI 프롬프트 수정 시 알림장/관찰일지 차별화가 깨지지 않는지 확인.
6. 새 DB 테이블·필드 추가 시 `DB_VERSION` 증가 + Dexie 마이그레이션 + `exportAll`/`importAll`/`getCounts`/`clearAllData` 모두 갱신.
7. 사용자 요청을 임의로 확장하지 말 것 (코드 미니멀리즘 우선).

## 새 세션을 시작할 때 사용자에게 받을 정보
디자인 교체 작업이라면 다음을 먼저 확인:
1. 디자인 레퍼런스 (Figma 링크, 스크린샷, 참고 사이트 URL)
2. 적용 범위 (전체 리뉴얼 vs 부분 교체)
3. 토큰 정책 (현 토큰 위에 새 토큰 추가 vs 완전 교체)
4. 폰트 변경 여부
5. 다크모드 도입 여부
