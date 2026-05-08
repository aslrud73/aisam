# 쌤노트 디자인 적용 지시서

> 이 문서는 Claude Code 새 세션에 전달하는 최종 디자인 지시서입니다.
> 첨부된 두 HTML 시안 파일과 함께 사용하세요.

---

## 작업 범위

### 해야 할 것
- ✅ 디자인 시스템 적용 (색상, 폰트, 간격)
- ✅ 메뉴 구조 변경 (하이브리드)
- ✅ 로고 추가
- ✅ SVG 일러스트 8종 추가
- ✅ 모바일/데스크톱 반응형 적용

### 하지 말아야 할 것
- ❌ 기능 추가/제거 (디자인만 변경)
- ❌ 알림장/관찰일지 차별화 로직 변경 (이미 완료됨)
- ❌ 새로운 페이지 추가
- ❌ 데이터 구조 변경

---

## 1. 앱 정체성

### 앱 이름
**쌤노트** (이전: 쌤chat → 변경)

### 슬로건
**선생님의 1시간을 돌려드립니다**

### 핵심 가치
유치원·어린이집 교사가 매일 1~2시간 걸리는 알림장·관찰일지·학부모 답변·놀이기록을 AI로 10분에 끝내는 도구.

---

## 2. 디자인 시스템

### 색상 팔레트 (CSS Variables)

```css
:root {
  /* === 차분 베이스 === */
  --bg-cream: #FBF7F0;        /* 메인 배경 */
  --bg-warm: #F5EFE3;         /* 보조 배경 */
  --card-white: #FFFFFF;      /* 카드 */
  --card-soft: #FDFAF4;       /* 부드러운 카드 */
  
  /* === 텍스트 === */
  --text-primary: #2C2420;    /* 본문 */
  --text-secondary: #6B5D52;  /* 보조 텍스트 */
  --text-tertiary: #9A8C81;   /* 캡션 */
  --text-on-accent: #FFFFFF;  /* 강조 위 텍스트 */
  
  /* === 쨍한 포인트 (기능별 매핑) === */
  --accent-coral: #E85A4F;        /* 알림장, 메인 액션 */
  --accent-coral-light: #F58575;
  --accent-coral-bg: #FCE8E5;
  
  --accent-sage: #5B8A6F;         /* 관찰일지, 출석 */
  --accent-sage-light: #8BB39A;
  --accent-sage-bg: #E5EFE9;
  
  --accent-mustard: #D4A537;      /* 학부모 답변, 강조 */
  --accent-mustard-light: #E8C467;
  --accent-mustard-bg: #FBF1D8;
  
  --accent-lavender: #8B7BB5;     /* 놀이기록 */
  --accent-lavender-bg: #ECE7F4;
  
  --accent-navy: #2D4A6B;         /* 성장 리포트 */
  --accent-navy-bg: #DCE6F0;
  
  /* === 보더 === */
  --border-light: #EFE8DC;
  --border-medium: #DCD2C2;
  --border-strong: #B8AB97;
  
  /* === 그림자 === */
  --shadow-sm: 0 1px 2px rgba(44, 36, 32, 0.04);
  --shadow-md: 0 2px 8px rgba(44, 36, 32, 0.06);
  --shadow-lg: 0 8px 24px rgba(44, 36, 32, 0.08);
  --shadow-coral: 0 4px 14px rgba(232, 90, 79, 0.25);
}
```

### 폰트 (Pretendard)

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">
```

```css
body {
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
  letter-spacing: -0.01em;
  -webkit-font-smoothing: antialiased;
}
```

### 폰트 위계

| 용도 | 크기 | 굵기 | letter-spacing |
|------|------|------|----------------|
| 앱 로고 | 1.25rem (20px) | ExtraBold (800) | -0.04em |
| 페이지 제목 | 1.5rem (24px) | ExtraBold (800) | -0.04em |
| 섹션 제목 | 1.125rem (18px) | Bold (700) | -0.02em |
| 강조 본문 | 1.125rem (18px) | Medium (500) | -0.01em |
| 본문 | 1rem (16px) | Regular (400) | -0.01em |
| 캡션 | 0.875rem (14px) | Medium (500) | -0.01em |
| 라벨 | 0.75rem (12px) | SemiBold (600) | 0.02em (대문자) |

### 둥글기 시스템

```css
--radius-sm: 0.5rem;    /* 8px - 칩, 작은 버튼 */
--radius-md: 0.75rem;   /* 12px - 입력창, 일반 버튼 */
--radius-lg: 1rem;      /* 16px - 카드 */
--radius-xl: 1.5rem;    /* 24px - 큰 컨테이너 */
--radius-full: 9999px;  /* 칩, 토글 */
```

---

## 3. 메뉴 구조 — 하이브리드

### 반응형 분기점

| 디바이스 | 화면 너비 | 메뉴 구조 |
|----------|-----------|-----------|
| 모바일 | < 768px | **하단 탭 + 상단 헤더(로고만)** |
| 태블릿 | 768px ~ 1023px | **상단 메뉴 (가로)** |
| 데스크톱 | ≥ 1024px | **좌측 사이드바** |

### Tailwind 적용 예시

```jsx
// 모바일: 하단 탭 표시 (lg 이상에서 숨김)
<nav className="lg:hidden fixed bottom-0 left-0 right-0 ...">
  <BottomTabs />
</nav>

// 데스크톱: 좌측 사이드바 표시 (lg 이상에서만)
<aside className="hidden lg:flex lg:w-[220px] ...">
  <Sidebar />
</aside>

// 태블릿: 상단 메뉴 (md 이상, lg 미만)
<header className="hidden md:flex lg:hidden ...">
  <TopMenu />
</header>
```

### 메뉴 항목 (6개)

| 순서 | 라벨 | 경로 | 아이콘 색상 |
|------|------|------|-------------|
| 1 | 오늘 기록 | `/` | Coral |
| 2 | 학부모 답변 | `/parent` | Mustard |
| 3 | 놀이기록 | `/play` | Lavender |
| 4 | 성장 리포트 | `/reports` | Navy |
| 5 | 설정 | `/settings` | Neutral |
| 6 | 사용 설명서 | `/help` | Neutral |

### 데스크톱 사이드바 추가 요소

좌측 사이드바 하단에 **이번 달 누적 통계** 박스 추가:

```jsx
<div className="mt-auto p-3 bg-coral-bg rounded-md">
  <div className="text-xs font-bold text-coral">이번 달 누적</div>
  <div className="text-xs text-secondary">알림장 {n} · 관찰일지 {n}</div>
</div>
```

### 사이드바 카테고리 분리

```
[매일 사용]
- 오늘 기록
- 학부모 답변
- 놀이기록

[정기 작성]
- 성장 리포트

[관리]
- 설정
- 사용 설명서
```

---

## 4. 로고 디자인 — D 미니멀형

### SVG 코드 (앱 로고)

```svg
<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- 배경 (코랄 그라데이션) -->
  <defs>
    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E85A4F"/>
      <stop offset="100%" stop-color="#F58575"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="url(#logoGradient)"/>
  
  <!-- 노트 -->
  <rect x="14" y="22" width="36" height="38" rx="3" fill="white"/>
  <line x1="20" y1="38" x2="44" y2="38" stroke="#E85A4F" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="20" y1="44" x2="40" y2="44" stroke="#E85A4F" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
  <line x1="20" y1="50" x2="42" y2="50" stroke="#E85A4F" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
  <line x1="20" y1="56" x2="38" y2="56" stroke="#E85A4F" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>
  
  <!-- 사람 얼굴 (노트 위) -->
  <circle cx="32" cy="18" r="10" fill="white"/>
  <circle cx="29" cy="17" r="1" fill="#2C2420"/>
  <circle cx="35" cy="17" r="1" fill="#2C2420"/>
  <path d="M29 21 Q32 23 35 21" stroke="#2C2420" stroke-width="1" fill="none" stroke-linecap="round"/>
</svg>
```

### 사이즈별 사용

| 사용처 | 크기 | 비고 |
|--------|------|------|
| 앱 헤더 (사이드바) | 36px | 그라데이션 배경 + 흰색 노트 |
| 모바일 헤더 | 32px | 동일 |
| 파비콘 | 16x16, 32x32 | 단순화 버전 (얼굴 + 노트만) |
| 앱 아이콘 (PWA) | 192px, 512px | 풀 디자인 |

---

## 5. SVG 미니 일러스트 (8종)

각 일러스트는 100x100 viewBox로 그립니다. 사용 위치는 디자인 시안 HTML 파일 참고.

| 번호 | 이름 | 용도 |
|------|------|------|
| 1 | 알림장 작성 (노트+펜+별) | 오늘 기록 페이지 헤더 |
| 2 | 관찰일지 (클립보드+체크) | 관찰일지 모드 헤더 |
| 3 | 학부모 답변 (말풍선+하트) | 학부모 답변 페이지 헤더 |
| 4 | 놀이기록 (카메라+반짝) | 놀이기록 페이지 헤더 |
| 5 | 성장 리포트 (차트+별) | 성장 리포트 페이지 헤더 |
| 6 | 우리 반 (사람들+하트) | 명단 관리 헤더 |
| 7 | 빈 상태 (텅빈 박스+물음표) | 데이터 없을 때 |
| 8 | 완료 (체크 원+반짝) | 생성 완료 알림 |

> **모든 SVG 코드는 첨부된 `ssaem-note-design.html` 파일의 "5. SVG 일러스트" 섹션에 있습니다.**

---

## 6. 핵심 컴포넌트 변경

### 6.1 알림장 / 관찰일지 모드 탭

기존: 단순 토글 → **변경: 강한 시각적 차별화**

```jsx
<div className="grid grid-cols-2 gap-2 mb-6">
  <button className="mode-tab active coral">
    <div className="title">📝 알림장</div>
    <div className="desc">매일 학부모님께 보내는 일일 기록</div>
  </button>
  <button className="mode-tab">
    <div className="title">📋 관찰일지</div>
    <div className="desc">누리과정 영역과 연계된 전문 기록</div>
  </button>
</div>
```

**스타일**:
- 비활성: 흰색 배경 + 회색 보더
- 활성 (알림장): 코랄 그라데이션 + 흰 텍스트 + 그림자
- 활성 (관찰일지): 세이지 그라데이션 + 흰 텍스트

### 6.2 학생 칩 (출석 표시)

```jsx
<div className="chip present">
  <div className="chip-name">강민경</div>
  <div className="chip-meta">최근 오늘</div>
</div>

<div className="chip absent">
  <div className="chip-name">이수정</div>
  <div className="chip-meta">결석</div>
</div>
```

**스타일**:
- 출석: `bg-sage` + 흰 텍스트
- 결석: `bg-warm` + 회색 텍스트 + 취소선

### 6.3 결과 카드 (알림장 / 관찰일지)

알림장 결과:
- 배경: `var(--accent-coral-bg)` (#FCE8E5)
- 보더: `var(--accent-coral-light)`

관찰일지 결과:
- 배경: `var(--accent-sage-bg)` (#E5EFE9)
- 보더: `var(--accent-sage-light)`

각 카드에 아이 아바타 (이름 첫 글자) 추가:
```jsx
<div className="child-avatar">강</div>
```

아바타 색상은 아이마다 다르게 (coral / sage / mustard / lavender / navy 순환).

---

## 7. 애니메이션 — 적당한 트랜지션 (B 옵션)

### 적용할 트랜지션

| 요소 | 트랜지션 |
|------|----------|
| 모든 버튼 | `transition: all 0.15s` |
| 카드 호버 | `transform: translateY(-2px); box-shadow 강화` |
| 큰 액션 버튼 | 호버 시 `translateY(-1px)` + 그림자 진해짐 |
| 페이지 전환 | `fade 200ms` |
| 입력창 포커스 | `border-color + box-shadow 0 0 0 3px coral-bg` |
| 칩 클릭 | `scale(0.95)` 살짝 |

### 적용하지 말 것

- ❌ 스크롤 패럴랙스
- ❌ 등장 애니메이션 (페이지 진입 시 모든 요소가 순차 등장)
- ❌ 일러스트 흔들림
- ❌ 호버 시 회전, 변형

### Tailwind 설정 예시

```jsx
<button className="transition-all duration-150 hover:-translate-y-px hover:shadow-coral">
  알림장 만들기
</button>

<div className="transition-all duration-200 hover:shadow-lg">
  카드 콘텐츠
</div>
```

---

## 8. 반응형 분기점 정리

### 핵심 분기점 (Tailwind 표준)

| 분기점 | 너비 | Tailwind 접두사 |
|--------|------|----------------|
| 모바일 | < 640px | (default) |
| 태블릿 | ≥ 640px | `sm:` |
| 작은 데스크톱 | ≥ 768px | `md:` |
| 데스크톱 | ≥ 1024px | `lg:` |
| 큰 데스크톱 | ≥ 1280px | `xl:` |

### 주요 적용

```jsx
{/* 그리드 */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">

{/* 패딩 */}
<div className="px-4 md:px-6 lg:px-8">

{/* 사이드바 표시 */}
<aside className="hidden lg:flex">

{/* 하단 탭 표시 */}
<nav className="lg:hidden">

{/* 텍스트 크기 */}
<h1 className="text-2xl md:text-3xl">
```

---

## 9. 절대 변경하지 말 것

다음 항목은 이미 완료된 상태이며, 디자인 작업 중에 절대 변경하면 안 됩니다.

### 9.1 알림장 / 관찰일지 차별화 로직

| 항목 | 알림장 | 관찰일지 |
|------|--------|----------|
| 종결어미 | "~답니다, 보냈어요" | "~관찰됨, ~보임" |
| 시점 | 1인칭 (편지체) | 3인칭 (객관) |
| 길이 | 3~7문장 | 10~14문장 |
| 누리과정 영역 | 미언급 | **반드시 명시** |
| 구조 | 일기 흐름 | [관찰 상황] / [발달적 의미] / [교사 지원 방향] |

### 9.2 기능 구조

- 출석 관리 (전체 출석/해제, 칩으로 토글)
- 명단 import/export (.txt)
- 리포트 기간 6가지 (이번 달/지난 달/1학기/2학기/올해 전체/직접 선택)
- 리포트 반영 체크박스
- BYOK (사용자 API 키 직접 입력)
- 다중 프로바이더 (Claude/OpenAI/Gemini)

이 모든 기능은 **그대로 유지**하면서 디자인만 변경하는 것입니다.

---

## 10. 작업 순서

Claude Code가 다음 순서로 작업하기를 권장합니다:

### Phase 1: 기반 (15분)
1. `app/globals.css`에 CSS 변수 추가
2. `app/layout.tsx`에 Pretendard 폰트 로드 추가
3. `tailwind.config.ts`에 색상 토큰 추가
4. 앱 이름 변경 (쌤chat → 쌤노트)

### Phase 2: 컴포넌트 (30분)
5. 로고 SVG 컴포넌트 생성
6. 8종 일러스트 SVG 컴포넌트 생성
7. 모드 탭 컴포넌트 (알림장/관찰일지)
8. 학생 칩 컴포넌트 (출석/결석)
9. 결과 카드 컴포넌트

### Phase 3: 레이아웃 (30분)
10. 모바일 하단 탭 컴포넌트
11. 데스크톱 사이드바 컴포넌트
12. 태블릿 상단 메뉴 컴포넌트
13. 반응형 분기 적용
14. 페이지 컨테이너 통일

### Phase 4: 적용 (45분)
15. 메인 페이지 (`/`) 디자인 적용
16. 학부모 답변 (`/parent`) 디자인 적용
17. 놀이기록 (`/play`) 디자인 적용
18. 성장 리포트 (`/reports`) 디자인 적용
19. 설정 (`/settings`) 디자인 적용
20. 사용 설명서 (`/help`) 디자인 적용

### Phase 5: 검증 (15분)
21. 모바일 (375px) 화면 검증
22. 태블릿 (768px) 화면 검증
23. 데스크톱 (1280px) 화면 검증
24. 빌드 테스트
25. main 브랜치 머지 → Vercel 배포

**예상 총 소요 시간: 약 2시간 15분**

---

## 11. 검증 체크리스트

머지 전 다음 항목을 모두 확인하세요:

### 시각적 검증
- [ ] 폰트가 Pretendard로 적용되었는가?
- [ ] 로고가 모든 사이즈에서 잘 보이는가?
- [ ] 알림장/관찰일지 모드 탭의 색상 차별화가 명확한가?
- [ ] 출석/결석 칩이 직관적으로 구분되는가?
- [ ] 모바일 하단 탭이 한 손 조작 가능한 위치인가?
- [ ] 데스크톱 사이드바의 카테고리 분리가 자연스러운가?

### 기능 검증
- [ ] 모든 페이지가 정상 작동하는가?
- [ ] 알림장 생성 결과가 코랄 카드로 표시되는가?
- [ ] 관찰일지 생성 결과가 세이지 카드로 표시되고 누리과정 영역이 명시되는가?
- [ ] 출석 토글이 정상 작동하는가?
- [ ] 사용자 API 키 입력이 정상 작동하는가?

### 반응형 검증
- [ ] 375px (모바일): 하단 탭 표시, 단일 컬럼
- [ ] 768px (태블릿): 상단 메뉴 표시
- [ ] 1024px (데스크톱): 좌측 사이드바 표시
- [ ] 1280px (큰 데스크톱): 콘텐츠 가운데 정렬, 양쪽 여백

### 성능 검증
- [ ] 빌드 성공
- [ ] Vercel 배포 성공
- [ ] 첫 페이지 로딩 3초 이내

---

## 12. 작업 후 보고 형식

작업 완료 후 다음 형식으로 보고해주세요:

```
[작업 완료 보고]

1. 변경된 파일 목록:
   - app/globals.css
   - app/layout.tsx
   - app/page.tsx
   - ... 등

2. 추가된 컴포넌트:
   - components/Logo.tsx
   - components/illustrations/*.tsx
   - ... 등

3. 검증 결과:
   - 모바일 (375px): ✅ / ❌
   - 태블릿 (768px): ✅ / ❌
   - 데스크톱 (1024px+): ✅ / ❌
   - 빌드: ✅ / ❌
   - Vercel 배포: ✅ / ❌

4. 알려진 이슈 또는 미적용 항목:
   - (있다면 명시)

5. 머지 전 추가 확인 필요 사항:
   - (있다면 명시)
```

---

## 13. 첨부 파일 안내

이 지시서와 함께 다음 두 HTML 파일이 첨부됩니다:

1. **`ssaem-note-design.html`** — 종합 디자인 시안
   - 디자인 시스템 가이드
   - 메뉴 구조 시안 (B형 + C형)
   - 알림장/관찰일지 결과 화면
   - SVG 일러스트 8종

2. **`ssaem-note-teacher-logos.html`** — 로고 시안
   - 4가지 방향 비교
   - **선택된 로고: 방향 D (미니멀형)**

두 파일을 브라우저에서 열어 시각적 참고로 사용하세요. 색상, 간격, 비율, SVG 코드 등을 모두 추출 가능합니다.

---

## 14. 작업 시 주의사항

### 기능에 손대지 말 것
- 알림장/관찰일지 차별화 로직은 이미 완벽함
- 디자인만 변경 (색상, 폰트, 레이아웃, 일러스트, 메뉴 구조)
- 새 기능 추가 제안 금지

### 단일 세션에서 마무리
- 한 번의 세션에서 모든 디자인 작업 완료
- 머지까지 진행
- 새 아이디어가 떠올라도 별도 세션으로 분리

### 본인(별쫑/민경)이 직접 검증
- 작업 완료 후 본인이 5건 이상 직접 사용 검증
- 데스크톱/모바일 둘 다 사용 검증
- 검증 통과 시에만 다른 사용자에게 공유

---

**이 지시서는 한 번의 디자인 적용 작업을 위한 것입니다. 추가 작업은 새 세션에서 시작하세요.**
