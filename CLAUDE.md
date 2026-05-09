# 쌤노트 — Claude 세션 핸드오프 문서

## 프로젝트 한 줄 요약
유치원·어린이집 선생님을 위한 **AI 기반 기록 자동화 PWA**. 알림장·관찰일지·학부모 답변·놀이기록·성장 리포트 5가지 도구. 본인 API 키로 Claude / OpenAI / Gemini 중 선택 (BYOK).

운영(production): https://aisam.vercel.app — 옛 main 코드 (PR #1 시점)
v2 Preview: https://aisam-git-claude-design-update-v2-decentration73-6921s-projects.vercel.app/ — 최종 모습

## 현재 상태 (2026-05 기준)
- **작업 브랜치**: `claude/design-update-v2`
- **상태**: 출시 가능. v2 → main 머지 PR만 만들면 됨.
- **남은 작업**: 별쫑님 결정에 따라 출시 PR 생성 (G 작업)
- 폐기 브랜치: `claude/design-update-7JlCk` (1차 시도), `claude/fix-gemini-model` (구 hotfix). 별쫑님이 GitHub 웹에서 직접 삭제 가능.

## 직전 세션에서 한 일 (전부 v2 브랜치에 적용 완료)

### 디자인 시스템 v2
- 사이드바(데스크톱) + 하단탭(모바일) + 태블릿 상단 메뉴 하이브리드 네비
- 일러스트 8종 추가 (`app/components/illustrations/`)
- Logo 컴포넌트 (`Logo.tsx`)
- 카드 라인 제거 + 그림자 강화 (`shadow-card`)
- 페이지별 강조 톤 통일 (메뉴 ↔ 페이지 ↔ 카드)
- **알림장(coral) / 관찰일지(sage) 모드 분기** — CSS 변수 `--accent-*` + `data-mode={docType}`로 자동 전환
- HistorySection 페이지 톤 자동 따라가기 — `--page-accent-*` + `data-page="..."`
- 카드 폭 일관성 (`max-w-4xl mx-auto`)
- 모바일 헤더 stack, Footer 가림 수정 (`pb-28 lg:pb-8`)
- 사이드바 비활성 메뉴 weight 500
- 라벨 볼드 (식사·기분·낮잠·메모)
- 알림장/관찰일지 칩 의미별 색 구분 (coral / sage)

### 기능
- **"공통" 카드** 추가 (`ANONYMOUS_KID_ID = "__anonymous__"`)
  - 명단 맨 앞 점선 회색 카드 (활성 시 페이지 톤)
  - 1:1 컨셉 보존 + 일반 메시지 슬롯 분리
  - `dailyEntries`에 `kidId="__anonymous__"`로 누적
  - `/reports`에서 "공통" 그룹 표시되지만 한 달 리포트 생성 비활성
  - `app/api/generate/route.ts`에서 anon 분기 (이름 안 부르는 일반 안내문)
- 빈 입력 검증 (`page.tsx`의 generate): 활동 또는 메모 텍스트 한 줄 필수
- 명단 .txt import/export (PR #2)
- **백업 가져오기 병합** — 이름 매칭 통합 (수동 동기화)
  - PC ↔ 스마트폰 두 기기 누적 합치기
  - `app/lib/db.ts`의 `importAll` 함수가 명단 매칭 + kidId 변환
- **Gemini 모델 hotfix** — `gemini-flash-latest` (자동 별칭). `app/lib/providers/types.ts`의 `DEFAULT_MODELS.gemini` + `MODEL_CHOICES.gemini` 변경
- **PWA 자동 설치 안내** — `app/components/PWAInstallPrompt.tsx`. 안드로이드 `beforeinstallprompt` + iOS Safari 수동 안내. localStorage `pwa-install-dismissed`로 영구 닫기.

### 사용자 안내
- 도움말 전면 갱신 (`app/help/page.tsx`) — 모든 신규 기능 반영
- **에러 메시지 친절한 한국어** — `app/lib/errorMessage.ts` (`fetchErrorMessage`, `friendlyError`). 모든 페이지에서 import.
- 자동 백업 권유 안내 — `DataSection`의 강조 박스
- 명단 0명 빈 상태에 `ClassIllust` 적용

## 결정된 디자인·컨셉

### 페이지별 톤 매핑
| 페이지 | 톤 |
|---|---|
| `/` 오늘 기록 | docType 분기: alrim → coral, gwanchal → sage |
| `/parent` 학부모 답변 | mustard |
| `/play` 놀이기록 | lavender |
| `/reports` 성장 리포트 | navy |
| `/settings`, `/help` | coral (기본) |

### CSS 변수 시스템
- `--accent-*` (메인 페이지 모드별, `[data-mode="alrim"]`/`"gwanchal"`)
- `--page-accent-*` (페이지별, `[data-page="parent"]`/`"play"`/`"reports"`)
- 둘은 다른 용도. 자식 컴포넌트(HistorySection 등)가 prop drilling 없이 자동 따라감.

### "공통" 카드 디자인
- 명단 맨 앞 항상 표시
- 비활성: 점선 회색 보더 (`border-warm-300 border-dashed`)
- 활성: `bg-[var(--accent-500)]` (모드별)
- 명단 수정 모드에서 보호 (삭제·이름변경 X)
- 리포트의 한 달 생성 비활성 + 안내 ("1:1 컨셉")

### 데이터 정책 (변하지 않음)
- 모든 데이터 사용자 IndexedDB에만 저장
- 서버는 AI 호출 중계만 (저장 X)
- 백업: .json (전체) + .txt (명단만)
- 병합 시 이름 매칭으로 자동 통합 → "수동 동기화" 형태

## 수익 모델 — 별쫑님과 논의 완료 (출시 후 도입)

별쫑님은 **개인사업자 + 통신판매업 신고** 보유 → 정식 결제 시스템 도입 가능.

### 결정된 모델
- **Lifetime 9,900원** (일회성 구매)
- **1코드 1사용자, 최대 2기기** (카카오톡 모델)
- **Self-service 기기 해제** (사용자가 직접 옛 기기에서 해제 → 새 기기 등록)
- 진짜 분실 시: 별쫑님 인스타 DM으로 강제 reset

### 결제 플로우 (계획)
- 인스타 DM 마케팅 → 별쫑님 계좌이체 또는 카카오페이 송금
- 별쫑님 **관리자 페이지(/admin)**에서 송금자명 입력 → 코드 자동 생성
- DM으로 코드 회신
- 사용자 앱 설정에서 코드 입력 → 평생 사용

### 베타 → 정식 흐름
- **출시 즉시 ~ 1~2개월**: 베타 무료 (BYOK 그대로, 코드 없음)
- **그 후**: 라이선스 코드 시스템 도입 (lifetime 9,900원)
- 베타 사용자에게 평생 50% 할인 또는 평생 무료 보상 검토

### 비용 구조 (예상)
- AI API: 0 (BYOK)
- 인프라: 1,000명까지 Vercel 무료, 그 이상 Pro $20/월
- 결제 수수료: 수동 0 / 토스페이 정기결제 2.5%
- 도메인: 연 3만원 (자체 도메인 시) — 현재는 vercel.app 무료

### 미구현 (출시 후 도입)
- `/admin` 관리자 페이지 (송금자명 → 코드 자동 생성)
- 라이선스 코드 검증 시스템 (Vercel KV 또는 Supabase)
- 코드별 deviceId 매핑 (1코드 2기기 추적)
- 클라이언트 코드 입력 UI (설정 페이지)

### 향후 확장 (1년+)
- Pro 추가 기능 (PDF 리포트, 면담 PPT 등) — 별도 구독
- B2B 어린이집 단체 라이선스 (50~150만원/년)
- 새 앱 / 국제 확장

## 출시 전 점검 — 현재 상태

- ✅ 디자인 v2 적용 완료
- ✅ 기능 안정화
- ✅ 도움말 갱신
- ✅ 에러 톤 친절하게
- ✅ 자동 백업 권유 안내
- ✅ PWA 자동 설치 안내
- ✅ 명단 0명 빈 상태 일러스트
- ⬜ PWA 본격 검증 (출시 후 production 도메인에서)
- ⬜ 폐기 브랜치 정리 (별쫑님이 GitHub 웹에서 직접)
- ⬜ **v2 → main 머지 PR 생성** ← 출시 시점

## 다음 세션 시작 가이드

### 별쫑님이 다음 세션에서 가능한 것
- "PR 만들어줘" → v2 → main 출시 PR 생성 (1분)
- "라이선스 시스템 만들기 시작" → /admin + 코드 검증 시스템 구현 (1~2일 작업)
- "빈 상태 일러스트 더" → /parent /play /reports의 HistorySection에 EmptyIllust 추가
- 검수 중 발견한 이슈 수정
- 새 기능 요청

### 별쫑님 의사소통 스타일 (메모)
- 한국어
- 짧고 명확한 메시지 선호 (긴 답변 부담)
- 핵심 + 옵션 정리 + 추천 형태 좋아함
- 결정 부담 시 "[No preference]" 또는 답변 미루심
- 시각적 피드백(스크린샷) 자주 보냄
- 우선순위: **기능 안정성 > 디자인** ("기능 절대 손상되면 안 됨")
- 출시 후 수익화에 진지한 관심 (사이드 프로젝트 + 부수입 형태)

### 일관된 작업 원칙
- JSX 트리/state/handler 변경 시 매우 신중. className 토큰만 변경이 가장 안전
- 큰 변경 전 별쫑님께 옵션 + 추천 + 결정 받기
- 각 commit 후 `npm run build` 검증
- Vercel Preview URL로 별쫑님 검수 → 다음 작업
- 별쫑님 시간 보호 (작업이 너무 큼면 단계 분리 제안)

## 기술 스택 (변경 없음)
- Next.js 14.2 (app router)
- TypeScript, React 18
- Tailwind CSS 3.4 — 커스텀 토큰만 사용
- Dexie 4 (IndexedDB)
- AI SDKs: `@anthropic-ai/sdk`, `openai`, `@google/genai` — BYO API 키

## 핵심 디렉토리 맵 (v2 신규 파일 추가)

```
app/
├── layout.tsx              # AppShell 사용, 메타데이터 "쌤노트"
├── globals.css             # --accent-*, --page-accent-* CSS 변수
├── page.tsx                # / 오늘 기록 (data-mode={docType})
├── parent/page.tsx         # /parent (data-page="parent")
├── play/page.tsx           # /play (data-page="play")
├── reports/page.tsx        # /reports (data-page="reports")
├── settings/page.tsx       # /settings
├── help/page.tsx           # /help (전면 갱신됨)
├── manifest.ts             # 쌤노트, theme_color #E85A4F
├── icon.tsx, apple-icon.tsx
├── components/
│   ├── AppShell.tsx        # ★ 신규: Sidebar + MobileHeader + BottomTabs + Footer + PWAInstallPrompt
│   ├── Sidebar.tsx         # ★ 신규 (데스크톱 좌측)
│   ├── MobileHeader.tsx    # ★ 신규 (모바일·태블릿 상단)
│   ├── BottomTabs.tsx      # ★ 신규 (모바일 하단탭)
│   ├── PWAInstallPrompt.tsx # ★ 신규 (자동 설치 안내)
│   ├── Logo.tsx            # ★ 신규 (쌤노트 로고)
│   ├── navItems.ts         # ★ 신규 (네비 항목 정의)
│   ├── illustrations/
│   │   └── index.tsx       # ★ 신규 (8종 일러스트)
│   ├── TopNav.tsx          # legacy (현재 미사용, layout이 AppShell 사용)
│   ├── Footer.tsx          # 모바일 하단 padding 28
│   ├── Icon.tsx            # 라인 아이콘
│   ├── SetupBanner.tsx
│   ├── DataSection.tsx     # 자동 백업 권유 박스 추가됨
│   └── HistorySection.tsx  # data-page 톤 자동 따라감
├── api/
│   ├── generate/route.ts   # anon 분기 추가
│   ├── parent/route.ts
│   ├── play/route.ts
│   └── report/route.ts
└── lib/
    ├── db.ts               # importAll에 이름 매칭 통합 로직
    ├── errorMessage.ts     # ★ 신규 (친절한 에러)
    ├── settings.ts
    ├── koreanName.ts
    └── providers/
        └── types.ts        # gemini-flash-latest 적용
public/
├── icon.svg
└── icon-maskable.svg
tailwind.config.ts          # coral/mustard/lavender/navy 9-shade 추가, sage-700/800 추가
```

## 디자인 시스템 (v2 최종)

### 색상 (tailwind.config.ts)
- **cream**: 배경 `#FBF7F0`
- **paper**: 카드 `#FFFFFF`
- **ink** / soft / muted / faint: 텍스트
- **warm** 50~400: 보더·서브 배경
- **terracotta** 50~800: legacy (기본 fallback에서 사용)
- **sage** 50~800: 관찰일지 모드 톤
- **coral** 50~800: 알림장 모드 톤 (`#E85A4F`)
- **mustard** 50~800 + bg: 학부모 페이지 (`#D4A537`)
- **lavender** 50~800 + bg: 놀이 페이지 (`#8B7BB5`)
- **navy** 50~800 + bg: 리포트 페이지 (`#2D4A6B`)
- **ssaem_sage** DEFAULT/light/bg: 보조

### 폰트
- **Pretendard** ExtraBold/Bold/Medium/Regular
- **Gowun Dodum** (`font-display`) — 빈 상태 메시지 한정

### CTA 버튼 표준 (v2)
- Primary (페이지별): `bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-white rounded-2xl shadow-sm` (메인) 또는 `bg-mustard-500` 등 (페이지별)
- Secondary: `bg-paper border border-warm-200 text-ink-soft`
- 복사 버튼: `bg-[var(--page-accent-100)] hover:bg-[var(--page-accent-200)] text-[var(--page-accent-700)]` (옅은 페이지 톤)

## AI 프롬프트 구조 (변경 없음, 중요)

### `app/api/generate/route.ts`
- 알림장 vs 관찰일지 시스템 프롬프트 강력히 분리. **절대 합치지 말 것.**
- anon (`__anonymous__`) 항목은 별도 분기: 이름 안 부르고 반 전체 일반 안내문

### 공통 규칙
- 호칭: given name만 (`민선이는`)
- 다른 아이 이름 노출 금지
- 진단·평가·낙인 표현 금지
- 의료적 진단 추측 금지
- 이모지 금지

## 데이터 (IndexedDB v2)
- **dailyEntries**: 알림장·관찰일지 (`kidId+date` 인덱스). 공통도 여기 누적 (kidId="__anonymous__")
- **parentReplies**: 학부모 답변
- **playJournals**: 놀이기록
- **growthReports**: 성장 리포트

`localStorage` (`oneul-notification-state-v2`): 명단·반 이름·오늘 활동·todayActivity·entries·tone·docType·selectedIds

## 브랜드/카피 규칙
- 앱 이름: **쌤노트** (이전 "쌤chat"에서 변경)
- 카피라이트: `© 꼬마나라 AI 티처랩. All rights reserved.`
- 카피 톤: 한국 유치원 교사 대상, 따뜻하지만 전문적. 비기술 사용자 친화.
- 이모지: 사용자가 명시적으로 요청하지 않는 한 사용 안 함.

## 빌드/배포
```bash
npm install
npm run dev      # localhost:3000
npm run build    # 변경 후 항상 통과 확인
git push         # Vercel Preview URL 자동 갱신
```

## 작업 시 지킬 컨벤션
1. 변경 후 `npm run build` 통과 확인 후 커밋
2. 커밋 메시지는 한국어 OK, 본문은 변경 의도 + 사용자 시나리오
3. 사용자에게 변경 요약은 한국어
4. 디자인 변경 시 토큰부터 (tailwind.config.ts → globals.css → 컴포넌트 → 페이지)
5. AI 프롬프트 수정 시 알림장/관찰일지 차별화 깨지지 않는지 확인
6. 새 DB 테이블·필드 추가 시 `DB_VERSION` 증가 + Dexie 마이그레이션 + `exportAll`/`importAll`/`getCounts`/`clearAllData` 모두 갱신
7. 사용자 요청을 임의로 확장하지 말 것 (코드 미니멀리즘 우선)
8. 페이지 파일의 JSX 트리/state/handler는 매우 신중. className 토큰 변경이 가장 안전.

## 새 세션 시작 시 별쫑님이 자주 시작하는 패턴
- "[페이지/요소] 어때?" — 시각 검수 → 의견 받기
- "이거 가능해?" — 기능 가능성 확인
- "OK" — 추천 그대로 진행
- "[No preference]" — 결정 미루심
- 스크린샷 첨부 → 시각적 피드백
