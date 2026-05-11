"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon, type IconName } from "../components/Icon";

function CopyablePrompt({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };
  return (
    <div className="bg-cream-100 rounded-xl p-3.5 mt-2 space-y-2.5">
      <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap">
        {text}
      </p>
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-coral-100 hover:bg-coral-200 text-coral-700 rounded-lg px-3 py-1.5 transition"
      >
        <Icon name="copy" size={14} strokeWidth={1.8} />
        {copied ? "복사됨!" : "프롬프트 복사"}
      </button>
    </div>
  );
}

interface Section {
  icon: IconName;
  title: string;
  body: React.ReactNode;
}

const SECTIONS: Section[] = [
  {
    icon: "info",
    title: "이 앱은 무엇인가요?",
    body: (
      <>
        <p>
          쌤노트는 유치원·어린이집 선생님이 매일 작성해야 하는 글들을 AI가
          초안으로 만들어 드리는 앱이에요. 한 반(20명) 알림장을 사람이 직접 쓰면
          1~2시간이 걸리지만, 쌤노트에서는 토글 몇 번과 짧은 메모 한 줄로
          5분이면 모든 아이의 알림장이 자동으로 작성돼요.
        </p>
        <p>
          AI가 만든 초안은 <strong>반드시 선생님이 검토·수정한 뒤</strong>
          학부모님이나 외부에 보내주세요. 이 앱은 선생님의 시간을 줄여드리는
          도구이지, 선생님의 전문적 판단을 대신하지 않아요.
        </p>
      </>
    ),
  },
  {
    icon: "key",
    title: "처음 시작하기 — API 키 등록",
    body: (
      <>
        <p>
          AI를 사용하려면 본인의 <strong>API 키</strong>가 한 번만 필요해요.
          API 키는 AI 회사에서 발급받는 비밀번호 같은 거예요. 이 키가 있어야
          본인의 사용량으로 알림장을 만들 수 있어요.
        </p>
        <ol className="list-decimal pl-5 space-y-1.5">
          <li>
            상단 메뉴의 <strong>설정</strong> 탭을 눌러 들어가세요.
          </li>
          <li>
            "API가 뭐예요? 처음이라면 꼭 한 번 읽어주세요" 박스를 펼쳐
            한 번 읽어주세요.
          </li>
          <li>
            <strong>1단계</strong>에서 AI를 고르세요. 처음이라면 무료 티어가 가장 넉넉한{" "}
            <strong>Gemini (제미나이)</strong>를 추천드려요.
          </li>
          <li>
            <strong>2단계</strong>에서 모델을 고르세요. 추천 모델로 두면 충분해요.
          </li>
          <li>
            <strong>3단계</strong>의 안내에 따라 해당 회사 사이트에서 키를 받아
            붙여넣고 <strong>저장</strong>하세요.
          </li>
        </ol>
        <p>
          비용은 사용한 만큼만 결제돼요. 한 반(20명) 알림장을 매일 만들어도
          한 달 1,000~5,000원 수준이에요. Gemini는 일정 사용량까지 무료예요.
        </p>
      </>
    ),
  },
  {
    icon: "sparkle",
    title: "API 키 발급이 어려우신가요? AI에게 물어보세요",
    body: (
      <>
        <p>
          API 키 발급 단계가 막막하시다면, <strong>챗GPT</strong>나{" "}
          <strong>제미나이</strong> 같은 AI 챗봇에 아래 프롬프트를 그대로
          복사해서 붙여넣어 보세요. 회원가입부터 키 복사까지 화면 위치를 짚어가며
          아주 자세히 안내해줘요.
        </p>
        <CopyablePrompt
          text={`나는 API에 대해 전혀 알지 못하는 사용자야. [Gemini / OpenAI / Claude 중 하나를 골라서 적어주세요] API 키를 발급받아서 사용할 수 있도록, 회원가입부터 결제 등록(또는 무료 가입), 키 복사까지 아주 자세히 단계별로 안내해줘. 가능하면 화면의 어디를 눌러야 하는지 위치도 함께 알려줘.`}
        />
        <p className="mt-3">
          무료로 쓸 수 있는 AI 챗봇 (회원가입만 하면 바로 질문 가능):
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            챗GPT —{" "}
            <a
              href="https://chatgpt.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-coral-600 underline underline-offset-2"
            >
              chatgpt.com
            </a>
          </li>
          <li>
            제미나이 —{" "}
            <a
              href="https://gemini.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-coral-600 underline underline-offset-2"
            >
              gemini.google.com
            </a>
          </li>
          <li>
            Claude —{" "}
            <a
              href="https://claude.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-coral-600 underline underline-offset-2"
            >
              claude.ai
            </a>
          </li>
        </ul>
        <p className="text-xs text-ink-muted mt-2">
          답변이 어렵게 느껴지시면 "더 쉽게 설명해줘" 또는 "한 단계씩 천천히
          알려줘"라고 다시 물어보세요.
        </p>
      </>
    ),
  },
  {
    icon: "note",
    title: "오늘 기록 — 알림장과 관찰일지",
    body: (
      <>
        <p>
          매일 사용하시는 메인 기능이에요. 한 번에 모든 아이의 알림장 또는
          관찰일지를 만들어 드려요.
        </p>
        <p>
          <strong>알림장</strong>은 학부모님께 카톡·키즈노트로 매일 보내는 짧은
          편지예요. 따뜻한 일기체로 3~7문장.
        </p>
        <p>
          <strong>관찰일지</strong>는 교사 본인이 보관하고 원장·교육청에
          제출하는 공식 기록이에요. [관찰 상황] · [발달적 의미] · [교사 지원
          방향] 세 섹션 구조로 자동 작성되며, 누리과정 5영역과 연결돼요.
        </p>
        <p className="font-semibold text-ink mt-2">사용 순서</p>
        <ol className="list-decimal pl-5 space-y-1.5">
          <li>
            상단의 <strong>알림장 / 관찰일지</strong> 모드 선택 (두 모드의 결과는
            각각 따로 저장돼요. 모드를 바꾸면 페이지 강조 색이 코랄/세이지로
            바뀌어 한눈에 구분돼요).
          </li>
          <li>
            <strong>1번 우리 반 아이들</strong>에 한 번 등록하면 매일 다시 입력할
            필요 없어요. 결석한 아이는 이름 버튼을 한 번 눌러 결석 처리하시고,
            <strong> 전체 출석 / 전체 해제</strong> 버튼으로 한 번에 전환할 수도
            있어요.
          </li>
          <li>
            <strong>이름 수정·졸업·삭제</strong>는 명단 영역의{" "}
            <strong>명단 수정</strong> 버튼을 누르면 가능해요. 이름을 바꿔도
            누적 기록은 그대로 유지돼요. 졸업/이동한 아이는 명단에서 빠지지만
            누적 리포트는 보존돼요.
          </li>
          <li>
            <strong>&apos;공통&apos; 카드</strong>는 명단 맨 앞에 항상 있는
            점선 보더 카드예요. 출석 처리 후 작성하면 특정 아이 이름 없이
            일반 안내문(예: &quot;내일 도시락 잊지 마세요&quot; 같은 학부모
            공지)을 만들 수 있어요. 단 한 달 성장 리포트는 이 카드로 만들지
            않아요 (1:1 컨셉 보존).
          </li>
          <li>
            <strong>2번 오늘의 활동</strong>에 오늘 한 활동을 한 줄로 적어주세요.
          </li>
          <li>
            <strong>3번 아이별 오늘 모습</strong>에서 식사·기분·낮잠 토글을
            누르거나 특이사항만 짧게 적어주세요. 비워두셔도 괜찮지만, 활동도
            메모도 모두 빈칸이면 알림장이 만들어지지 않으니 한 줄이라도 적어
            주세요.
          </li>
          <li>
            <strong>4번 생성하기</strong>를 누르면 출석된 모든 아이의
            알림장/관찰일지가 한 번에 만들어져요.
          </li>
          <li>
            <strong>5번 결과</strong>에서 직접 수정하거나 복사해서
            키즈노트·카톡에 붙여넣으세요.
          </li>
        </ol>
        <p className="font-semibold text-ink mt-2">명단 .txt 가져오기·내보내기</p>
        <p>
          명단 영역 아래의 <strong>명단 내보내기 (.txt)</strong> /
          <strong> 명단 가져오기</strong> 버튼으로 한 줄에 한 명씩 적힌
          텍스트 파일로 명단만 주고받을 수 있어요. 새 학년 시작 또는 다른
          선생님과 공유 시 유용해요.
        </p>
      </>
    ),
  },
  {
    icon: "chat",
    title: "학부모 답변 — 답변 초안 만들기",
    body: (
      <>
        <p>
          학부모님께 받은 메시지(질문, 우려, 감사, 결석 통보 등)에 어떻게
          답할지 막막할 때 사용하세요. AI가 공감 + 객관적 상황 + 교사의 다음
          행동까지 갖춘 답변 초안을 만들어드려요.
        </p>
        <ol className="list-decimal pl-5 space-y-1.5">
          <li>학부모님이 보내신 메시지 원문을 그대로 붙여넣기.</li>
          <li>
            상황 분류 선택: 일반 문의 / 친구 갈등 / 안전·다침 / 식사·건강 /
            발달 우려 / 칭찬·감사 / 결석·등하원 중 가장 가까운 것.
          </li>
          <li>
            아이 이름과 교사가 본 상황을 적어주시면 답변이 더 자연스러워져요.
          </li>
          <li>톤(따뜻하게 / 신중하게 / 간결하게) 선택 후 생성.</li>
        </ol>
        <p>
          저장된 답변은 페이지 하단{" "}
          <strong>지난 답변 기록</strong> 섹션에서 다시 볼 수 있어요.
        </p>
      </>
    ),
  },
  {
    icon: "camera",
    title: "놀이기록 — 사진으로 만드는 놀이일지",
    body: (
      <>
        <p>
          놀이 사진과 짧은 메모만 올리면 누리과정 영역과 연결된 전문
          놀이기록이 만들어져요. 7개 섹션(놀이 주제·흐름·반응·배움·교사
          지원·확장·가정 연계)이 자동 작성돼요.
        </p>
        <p>
          사진은 자동으로 1280px·JPEG로 압축되며, <strong>서버에 저장되지
          않고</strong> 생성 직후 폐기돼요. 아이 얼굴이 식별되지 않는 사진을
          권장드려요 (놀이 장면·작품·활동 위주).
        </p>
        <p>
          저장된 놀이기록은 페이지 하단{" "}
          <strong>지난 놀이기록</strong> 섹션에서 다시 볼 수 있어요.
        </p>
      </>
    ),
  },
  {
    icon: "chart",
    title: "성장 리포트 — 학부모 면담용 종합 리포트",
    body: (
      <>
        <p>
          누적된 알림장·관찰일지를 종합해서, 학부모님께 전달할 수 있는
          7-섹션 성장 리포트를 만들어 드려요. 학부모 상담·면담 자료로
          그대로 사용하실 수 있어요.
        </p>
        <ol className="list-decimal pl-5 space-y-1.5">
          <li>
            아이 선택 (누적된 기록이 있는 아이만 표시돼요. &apos;공통&apos;
            누적도 표시되지만 한 달 리포트는 만들지 않아요).
          </li>
          <li>
            기간 선택: <strong>이번 달 / 지난 달 / 1학기 / 2학기 /
            올해 전체 / 직접 지정</strong> 중 고를 수 있어요.
          </li>
          <li>
            <strong>이 기간 누적 기록</strong> 카드를 펼치면 어떤 글이
            들어갔는지 확인할 수 있고, 체크박스를 끄면 해당 기록을 리포트에서
            제외할 수 있어요. 빨간 휴지통 아이콘으로 영구 삭제도 가능합니다.
          </li>
          <li>
            <strong>포함할 기록 종류</strong>로 알림장만, 관찰일지만, 또는
            둘 다 선택할 수 있어요. 활성화된 칩 색으로 구분돼요 (알림장 코랄,
            관찰일지 세이지).
          </li>
          <li>리포트 생성하기.</li>
        </ol>
        <p>
          7개 섹션: 인사말 · 관심 놀이 · 또래 관계의 변화 · 언어 표현
          특징 · 신체 활동과 정서 표현 · 교사 지원 내용 · 가정 연계
          제안.
        </p>
      </>
    ),
  },
  {
    icon: "shield",
    title: "안전 가이드 — AI가 거르는 표현",
    body: (
      <>
        <p>
          쌤노트는 모든 결과물에서 다음을 자동으로 걸러요. 단, 100% 보장은
          아니므로 반드시 검토해 주세요.
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>진단·평가·낙인 표현</strong>: "공격성", "산만함", "발달
            지연", "ADHD", "사회성 부족", "문제 행동" 등 → "감정을 강하게
            표현하는 모습", "여러 활동에 호기심을 보이는 모습" 같은 부드러운
            표현으로 자동 변환.
          </li>
          <li>
            <strong>다른 아이 이름 노출 금지</strong>: 입력에 다른 아이 이름이
            등장해도 출력에는 절대 등장하지 않아요. "또래", "친구",
            "친구들"로 자동 통칭.
          </li>
          <li>
            <strong>의료·법적 판단 금지</strong>: "감기인 것 같아요" 대신
            "콧물이 조금 있어요. 가정에서도 살펴봐주세요" 같은 표현으로 자동
            변환.
          </li>
          <li>
            <strong>아이 이름 호칭 자연스럽게</strong>: 풀네임 "김민선이는"이
            아니라 "민선이는" 식으로 자동 변환 (받침 유무에 따라 자연스러운
            조사 사용).
          </li>
        </ul>
      </>
    ),
  },
  {
    icon: "settings",
    title: "데이터 저장과 백업",
    body: (
      <>
        <p>
          모든 데이터(아이 명단, 일일 기록, 학부모 답변, 놀이기록, 성장
          리포트)는 <strong>이 기기의 브라우저에만 저장</strong>돼요.
          저희 서버나 다른 기기에는 저장되지 않아요.
        </p>
        <p className="font-semibold text-ink mt-2">기기 옮기기 (덮어쓰기)</p>
        <p>
          새 기기에서 사용하시려면{" "}
          <strong>설정 → 데이터 관리 → 전체 내보내기 (.json)</strong>로
          백업 파일을 만든 뒤, 새 기기에서{" "}
          <strong>가져와서 덮어쓰기</strong>로 가져오세요. 한 번에
          명단·일일 기록·학부모 답변·놀이기록·리포트가 모두 옮겨져요.
        </p>
        <p className="font-semibold text-ink mt-2">두 기기 동시 사용 (병합)</p>
        <p>
          예: PC에서 매일 작성하다가 깜박 백업을 안 하고 퇴근, 스마트폰에서
          추가로 작성한 경우. 한 곳에 모으려면{" "}
          <strong>가져와서 병합</strong>을 누르세요. <strong>같은 이름의
          아이는 자동으로 통합</strong>되어 누적이 이어져요. 새로운 이름은
          명단에 추가됩니다.
        </p>
        <p className="font-semibold text-ink mt-2">명단만 주고받기 (.txt)</p>
        <p>
          오늘 기록 페이지의 <strong>명단 내보내기 (.txt)</strong> /
          <strong> 명단 가져오기</strong>로 명단만 텍스트 파일로 주고받을 수
          있어요. 한 줄에 한 명씩. 새 학년 시작이나 다른 선생님과 공유 시
          유용합니다.
        </p>
        <p className="font-semibold text-ink mt-2">공용 PC 사용 시</p>
        <p>
          반드시 사용 후 <strong>설정 → API 키 모두 지우기</strong> 와{" "}
          <strong>누적 기록 모두 삭제</strong>로 흔적을 지워주세요.
        </p>
      </>
    ),
  },
  {
    icon: "sparkle",
    title: "쌤노트를 휴대폰에 앱처럼 설치하기",
    body: (
      <>
        <p>쌤노트는 PWA(웹앱)이라 휴대폰 홈 화면에 설치할 수 있어요.</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <strong>아이폰</strong>: 사파리로 사이트 접속 → 화면 아래
            공유 버튼 → "홈 화면에 추가".
          </li>
          <li>
            <strong>안드로이드</strong>: 크롬으로 접속 → 주소창 옆 ⋮ 메뉴 →
            "앱 설치" 또는 "홈 화면에 추가".
          </li>
        </ul>
        <p>설치하면 브라우저 UI 없이 진짜 앱처럼 열려요.</p>
      </>
    ),
  },
];

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: "API 키가 노출되면 어떡하나요?",
    a: (
      <>
        AI 회사 사이트(설정 페이지의 키 발급 페이지)로 가서 해당 키를
        삭제(revoke)하고 새 키를 만들어 다시 등록하세요. 키는 이 기기 브라우저에만
        저장되므로, 앱 자체를 통해서는 노출되지 않아요.
      </>
    ),
  },
  {
    q: "다른 선생님과 사용량이 섞이지 않나요?",
    a: (
      <>
        섞이지 않아요. 각 선생님이 본인 키를 등록하기 때문에 사용량과 비용은
        선생님 본인 AI 계정으로 분리돼요. 저희는 키를 보관하지 않아요.
      </>
    ),
  },
  {
    q: "AI가 잘못된 내용을 쓰면요?",
    a: (
      <>
        AI 결과물은 <strong>초안</strong>이에요. 학부모님이나 외부에 보내기 전에
        반드시 선생님이 직접 검토·수정해 주세요. 사실관계나 아이의 실제 모습과
        다를 수 있어요.
      </>
    ),
  },
  {
    q: "사진은 어디에 저장되나요?",
    a: (
      <>
        놀이기록 사진은 AI 호출 시에만 임시로 사용되고 서버에 저장되지 않아요.
        결과 생성 후 즉시 폐기됩니다. 압축된 썸네일만 이 기기에 저장되어 나중에
        다시 볼 수 있어요.
      </>
    ),
  },
  {
    q: "한 달에 비용이 얼마나 나오나요?",
    a: (
      <>
        한 반(20명) 매일 알림장 기준으로:
        <ul className="list-disc pl-5 mt-1 space-y-1">
          <li>Gemini (Google): 무료 티어로 거의 무료 가능</li>
          <li>Claude: 약 1,000~3,000원</li>
          <li>OpenAI: 약 2,000~5,000원</li>
        </ul>
        모델과 글 길이에 따라 달라져요.
      </>
    ),
  },
];

export default function HelpPage() {
  return (
    <main className="max-w-4xl mx-auto px-5 py-8 pb-24 space-y-5">
      <div className="flex items-start gap-3">
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-coral-50 text-coral-600 shrink-0">
          <Icon name="book" size={20} strokeWidth={1.7} />
        </span>
        <div>
          <h1 className="text-2xl font-semibold text-ink tracking-tight">
            사용 설명서
          </h1>
          <p className="text-sm text-ink-soft mt-1 leading-relaxed">
            쌤노트를 처음 사용하시거나 기능을 더 알고 싶으실 때 펼쳐 보세요.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {SECTIONS.map((s, idx) => (
          <details
            key={idx}
            className="bg-paper rounded-2xl shadow-card group"
            open={idx === 0}
          >
            <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2.5 min-w-0">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-coral-50 text-coral-600 shrink-0">
                  <Icon name={s.icon} size={18} strokeWidth={1.7} />
                </span>
                <span className="font-semibold text-ink truncate">{s.title}</span>
              </span>
              <span className="text-xs text-ink-muted shrink-0 group-open:rotate-180 transition">
                ▾
              </span>
            </summary>
            <div className="px-5 pb-5 pt-0 text-sm text-ink-soft leading-relaxed space-y-2.5">
              {s.body}
            </div>
          </details>
        ))}
      </div>

      <section className="bg-paper rounded-2xl p-6 shadow-card">
        <h2 className="text-base sm:text-lg font-semibold text-ink mb-4 inline-flex items-center gap-2">
          <span className="text-coral-500">
            <Icon name="info" size={18} strokeWidth={1.7} />
          </span>
          자주 묻는 질문
        </h2>
        <div className="space-y-3">
          {FAQ.map((item, i) => (
            <details
              key={i}
              className="bg-cream-100 rounded-xl group"
            >
              <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-ink">Q. {item.q}</span>
                <span className="text-xs text-ink-muted group-open:rotate-180 transition">
                  ▾
                </span>
              </summary>
              <div className="px-4 pb-3 text-sm text-ink-soft leading-relaxed">
                {item.a}
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="bg-paper rounded-2xl p-6 shadow-card flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-ink">시작할 준비됐어요?</h2>
          <p className="text-xs text-ink-muted mt-1">
            아직 API 키 등록 안 하셨다면 설정에서 1분이면 끝나요.
          </p>
        </div>
        <Link
          href="/settings"
          className="shrink-0 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-coral-500 hover:bg-coral-600 text-white rounded-xl text-sm font-medium shadow-sm hover:shadow"
        >
          설정으로 가기
          <Icon name="link" size={14} strokeWidth={2} />
        </Link>
      </section>
    </main>
  );
}
