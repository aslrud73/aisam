"use client";

import { useState } from "react";
import { Icon, type IconName } from "../components/Icon";
import {
  AlrimIllust,
  GwanchalIllust,
  ParentIllust,
  PlayIllust,
  ReportIllust,
} from "../components/illustrations";
import {
  SAMPLE_ALRIM_BY_TONE,
  SAMPLE_GWANCHAL_BY_TONE,
  SAMPLE_PARENT_MESSAGE,
  SAMPLE_PARENT_REPLY_BY_TONE,
  SAMPLE_PLAY_INPUT,
  SAMPLE_PLAY_JOURNAL,
  SAMPLE_REPORT,
  SAMPLE_REPORT_KID_NAME,
  SAMPLE_REPORT_RANGE,
  SAMPLE_TODAY_ACTIVITY,
  type DemoToneAlrim,
  type DemoToneParent,
} from "../lib/samples";

type TabId = "alrim" | "parent" | "play" | "report";
type Accent = "coral" | "sage" | "mustard" | "lavender" | "navy";

const ACCENT_ACTIVE: Record<Accent, string> = {
  coral: "bg-coral-500 text-white border-coral-500 shadow-sm",
  sage: "bg-sage-500 text-white border-sage-500 shadow-sm",
  mustard: "bg-mustard-500 text-white border-mustard-500 shadow-sm",
  lavender: "bg-lavender-500 text-white border-lavender-500 shadow-sm",
  navy: "bg-navy-500 text-white border-navy-500 shadow-sm",
};

const ACCENT_BUTTON: Record<Accent, string> = {
  coral: "bg-coral-500 hover:bg-coral-600 text-white",
  sage: "bg-sage-500 hover:bg-sage-600 text-white",
  mustard: "bg-mustard-500 hover:bg-mustard-600 text-white",
  lavender: "bg-lavender-500 hover:bg-lavender-600 text-white",
  navy: "bg-navy-500 hover:bg-navy-600 text-white",
};

const ACCENT_TEXT: Record<Accent, string> = {
  coral: "text-coral-700",
  sage: "text-sage-700",
  mustard: "text-mustard-700",
  lavender: "text-lavender-700",
  navy: "text-navy-700",
};

const TABS: { id: TabId; label: string; icon: IconName; accent: Accent }[] = [
  { id: "alrim", label: "알림장·관찰일지", icon: "note", accent: "coral" },
  { id: "parent", label: "학부모 답변", icon: "chat", accent: "mustard" },
  { id: "play", label: "놀이기록", icon: "camera", accent: "lavender" },
  { id: "report", label: "성장 리포트", icon: "chart", accent: "navy" },
];

const PLAY_SECTION_LABELS: { key: keyof typeof SAMPLE_PLAY_JOURNAL; label: string }[] = [
  { key: "theme", label: "놀이 주제" },
  { key: "flow", label: "놀이 흐름" },
  { key: "reactions", label: "아이들의 반응" },
  { key: "learning", label: "배움의 순간" },
  { key: "support", label: "교사의 지원" },
  { key: "extension", label: "확장 아이디어" },
  { key: "homeConnection", label: "가정 연계" },
];

const REPORT_SECTION_LABELS: { key: keyof typeof SAMPLE_REPORT; label: string }[] = [
  { key: "intro", label: "한 줄 요약" },
  { key: "interests", label: "관심사와 활동" },
  { key: "peerRelations", label: "또래 관계" },
  { key: "language", label: "언어와 표현" },
  { key: "bodyAndEmotion", label: "신체와 정서" },
  { key: "teacherSupport", label: "교사의 지원" },
  { key: "homeConnection", label: "가정과 함께" },
];

export default function DemoPage() {
  const [tab, setTab] = useState<TabId>("alrim");

  return (
    <main className="max-w-4xl mx-auto px-5 py-8 pb-24 space-y-5">
      <div className="flex items-start gap-3">
        <span className="shrink-0 text-coral-500">
          <Icon name="sparkle" size={32} strokeWidth={1.6} />
        </span>
        <div>
          <h1 className="text-2xl font-semibold text-ink tracking-tight">
            체험해보기
          </h1>
          <p className="text-sm text-ink-soft mt-1 leading-relaxed">
            가입하지 않아도 4가지 기능이 어떻게 작동하는지 미리 볼 수 있어요.
            샘플 데이터로 결과를 확인해 보세요.
          </p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-semibold border transition ${
                active
                  ? ACCENT_ACTIVE[t.accent]
                  : "bg-paper text-ink-soft border-warm-200 hover:bg-warm-50"
              }`}
            >
              <Icon name={t.icon} size={14} strokeWidth={1.8} />
              {t.label}
            </button>
          );
        })}
      </div>

      <div data-page={tab === "parent" ? "parent" : tab === "play" ? "play" : tab === "report" ? "reports" : undefined}>
        {tab === "alrim" && <AlrimGwanchalDemo />}
        {tab === "parent" && <ParentDemo />}
        {tab === "play" && <PlayDemo />}
        {tab === "report" && <ReportDemo />}
      </div>
    </main>
  );
}

function HintBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-cream-100 rounded-2xl px-4 py-3 text-sm text-ink-soft leading-relaxed border border-warm-200">
      {children}
    </div>
  );
}

function InputCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-paper rounded-2xl shadow-card p-5 opacity-80">
      <h3 className="text-sm font-semibold text-ink-muted mb-2">{title}</h3>
      {children}
    </section>
  );
}

function ResultCard({
  title,
  accent,
  children,
}: {
  title: string;
  accent: Accent;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-paper rounded-2xl shadow-card p-6">
      <h3 className={`text-sm font-semibold mb-3 inline-flex items-center gap-1.5 ${ACCENT_TEXT[accent]}`}>
        <Icon name="check" size={14} strokeWidth={2} />
        {title}
      </h3>
      {children}
    </section>
  );
}

function ToneButton({
  active,
  onClick,
  label,
  accent,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  accent: Accent;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-full border text-sm transition ${
        active
          ? ACCENT_ACTIVE[accent]
          : "bg-paper text-ink-soft border-warm-200 hover:bg-warm-50"
      }`}
    >
      {label}
    </button>
  );
}

function GenerateButton({
  loading,
  onClick,
  accent,
  label,
}: {
  loading: boolean;
  onClick: () => void;
  accent: Accent;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-semibold disabled:bg-warm-200 disabled:text-ink-faint shadow-sm hover:shadow-md transition ${ACCENT_BUTTON[accent]}`}
    >
      {!loading && <Icon name="sparkle" size={16} strokeWidth={2} />}
      {loading ? "생성 중..." : label}
    </button>
  );
}

function AlrimGwanchalDemo() {
  const [docType, setDocType] = useState<"alrim" | "gwanchal">("alrim");
  const [tone, setTone] = useState<DemoToneAlrim>("warm");
  const [loading, setLoading] = useState(false);
  const [shown, setShown] = useState(false);

  const TONE_LABELS: Record<DemoToneAlrim, string> = {
    warm: "전문적이되 따뜻하게",
    concise: "간결하게",
    detailed: "상세하게",
  };

  const result =
    docType === "alrim"
      ? SAMPLE_ALRIM_BY_TONE[tone]
      : SAMPLE_GWANCHAL_BY_TONE[tone];

  async function run() {
    setShown(false);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setShown(true);
    setLoading(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="shrink-0">
          {docType === "alrim" ? (
            <AlrimIllust size={32} />
          ) : (
            <GwanchalIllust size={32} />
          )}
        </span>
        <p className="text-sm text-ink-soft leading-relaxed">
          오늘의 활동·식사·기분·낮잠·메모를 입력하면, 알림장(학부모용)이나
          관찰일지(교사용 객관 기록)로 자동 생성돼요.
        </p>
      </div>

      <InputCard title="입력 (샘플)">
        <ul className="space-y-1 text-sm text-ink-soft leading-relaxed">
          <li><strong className="text-ink">아이</strong>: 민준 (햇살반)</li>
          <li><strong className="text-ink">오늘 활동</strong>: {SAMPLE_TODAY_ACTIVITY}</li>
          <li><strong className="text-ink">민준의 모습</strong>: 잘 먹음 · 좋음 · 푹잠 · 친구들과 블록놀이 즐겁게 함. 모래성 쌓기 주도</li>
        </ul>
      </InputCard>

      <div className="bg-paper rounded-2xl shadow-card p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-ink-muted mr-1">종류</span>
          <ToneButton
            active={docType === "alrim"}
            onClick={() => {
              setDocType("alrim");
              setShown(false);
            }}
            label="알림장"
            accent="coral"
          />
          <ToneButton
            active={docType === "gwanchal"}
            onClick={() => {
              setDocType("gwanchal");
              setShown(false);
            }}
            label="관찰일지"
            accent="sage"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-ink-muted mr-1">문체</span>
          {(Object.keys(TONE_LABELS) as DemoToneAlrim[]).map((t) => (
            <ToneButton
              key={t}
              active={tone === t}
              onClick={() => {
                setTone(t);
                setShown(false);
              }}
              label={TONE_LABELS[t]}
              accent={docType === "alrim" ? "coral" : "sage"}
            />
          ))}
        </div>
        <HintBox>
          {!shown
            ? "문체를 선택하고 아래 ‘생성하기’를 눌러보세요. 문체를 바꾸면 결과 톤이 달라져요."
            : "다른 문체나 종류로 다시 눌러보세요. 같은 입력이라도 결과가 달라집니다."}
        </HintBox>
        <GenerateButton
          loading={loading}
          onClick={run}
          accent={docType === "alrim" ? "coral" : "sage"}
          label={`${docType === "alrim" ? "알림장" : "관찰일지"} 생성하기`}
        />
      </div>

      {shown && (
        <ResultCard
          title={`민준 · ${docType === "alrim" ? "알림장" : "관찰일지"} (${TONE_LABELS[tone]})`}
          accent={docType === "alrim" ? "coral" : "sage"}
        >
          <p className="text-sm leading-relaxed text-ink-soft whitespace-pre-wrap">
            {result}
          </p>
        </ResultCard>
      )}
    </div>
  );
}

function ParentDemo() {
  const [tone, setTone] = useState<DemoToneParent>("warm");
  const [loading, setLoading] = useState(false);
  const [shown, setShown] = useState(false);

  const TONE_LABELS: Record<DemoToneParent, string> = {
    warm: "따뜻하게",
    careful: "조심스럽게",
    concise: "간결하게",
  };

  async function run() {
    setShown(false);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setShown(true);
    setLoading(false);
  }

  return (
    <div className="space-y-5" data-page="parent">
      <div className="flex items-center gap-3">
        <span className="shrink-0">
          <ParentIllust size={32} />
        </span>
        <p className="text-sm text-ink-soft leading-relaxed">
          학부모님 메시지에 어떻게 답할지 막막할 때, 공감 + 객관적 상황 + 다음
          행동을 담은 답변 초안을 만들어 드려요.
        </p>
      </div>

      <InputCard title="학부모님 메시지 (샘플)">
        <p className="text-sm text-ink-soft leading-relaxed whitespace-pre-wrap">
          {SAMPLE_PARENT_MESSAGE}
        </p>
      </InputCard>

      <div className="bg-paper rounded-2xl shadow-card p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-ink-muted mr-1">문체</span>
          {(Object.keys(TONE_LABELS) as DemoToneParent[]).map((t) => (
            <ToneButton
              key={t}
              active={tone === t}
              onClick={() => {
                setTone(t);
                setShown(false);
              }}
              label={TONE_LABELS[t]}
              accent="mustard"
            />
          ))}
        </div>
        <HintBox>
          {!shown
            ? "문체를 선택하고 ‘생성하기’를 눌러보세요. 같은 메시지라도 문체에 따라 답변 톤이 달라져요."
            : "다른 문체로 다시 눌러보세요. 같은 입력이라도 결과가 달라집니다."}
        </HintBox>
        <GenerateButton
          loading={loading}
          onClick={run}
          accent="mustard"
          label="답변 초안 생성하기"
        />
      </div>

      {shown && (
        <ResultCard
          title={`답변 초안 (${TONE_LABELS[tone]})`}
          accent="mustard"
        >
          <p className="text-sm leading-relaxed text-ink-soft whitespace-pre-wrap">
            {SAMPLE_PARENT_REPLY_BY_TONE[tone]}
          </p>
        </ResultCard>
      )}
    </div>
  );
}

function PlayDemo() {
  const [loading, setLoading] = useState(false);
  const [shown, setShown] = useState(false);

  async function run() {
    setShown(false);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setShown(true);
    setLoading(false);
  }

  return (
    <div className="space-y-5" data-page="play">
      <div className="flex items-center gap-3">
        <span className="shrink-0">
          <PlayIllust size={32} />
        </span>
        <p className="text-sm text-ink-soft leading-relaxed">
          놀이 사진과 짧은 메모만 있으면, 누리과정 영역과 연결된 전문 놀이기록을
          7개 섹션으로 만들어 드려요.
        </p>
      </div>

      <InputCard title="입력 (샘플)">
        <ul className="space-y-1 text-sm text-ink-soft leading-relaxed">
          <li><strong className="text-ink">활동명</strong>: {SAMPLE_PLAY_INPUT.activityName}</li>
          <li><strong className="text-ink">연령</strong>: {SAMPLE_PLAY_INPUT.age}세</li>
          <li><strong className="text-ink">메모</strong>: {SAMPLE_PLAY_INPUT.note}</li>
        </ul>
      </InputCard>

      <div className="bg-paper rounded-2xl shadow-card p-6 space-y-4">
        <HintBox>
          {!shown
            ? "‘생성하기’를 눌러보세요. 짧은 메모가 7개 섹션의 풍부한 놀이기록으로 변환돼요."
            : "다시 눌러서 결과를 확인할 수 있어요."}
        </HintBox>
        <GenerateButton
          loading={loading}
          onClick={run}
          accent="lavender"
          label="놀이기록 생성하기"
        />
      </div>

      {shown && (
        <ResultCard title="놀이기록 (7섹션)" accent="lavender">
          <div className="space-y-3">
            {PLAY_SECTION_LABELS.map(({ key, label }) => (
              <div key={key}>
                <h4 className="text-xs font-semibold text-lavender-700 mb-1 tracking-wide">
                  {label}
                </h4>
                <p className="text-sm leading-relaxed text-ink-soft bg-[var(--page-accent-50)] border-l-2 border-lavender-300 rounded-2xl p-3.5 whitespace-pre-wrap">
                  {SAMPLE_PLAY_JOURNAL[key]}
                </p>
              </div>
            ))}
          </div>
        </ResultCard>
      )}
    </div>
  );
}

function ReportDemo() {
  const [loading, setLoading] = useState(false);
  const [shown, setShown] = useState(false);

  async function run() {
    setShown(false);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setShown(true);
    setLoading(false);
  }

  return (
    <div className="space-y-5" data-page="reports">
      <div className="flex items-center gap-3">
        <span className="shrink-0">
          <ReportIllust size={32} />
        </span>
        <p className="text-sm text-ink-soft leading-relaxed">
          누적된 알림장·관찰일지를 한 달, 한 학기, 한 해 단위로 종합해서 학부모님께
          전달할 7-섹션 성장 리포트를 만들어 드려요.
        </p>
      </div>

      <InputCard title="기록 범위 (샘플)">
        <ul className="space-y-1 text-sm text-ink-soft leading-relaxed">
          <li><strong className="text-ink">아이</strong>: {SAMPLE_REPORT_KID_NAME}</li>
          <li><strong className="text-ink">기간</strong>: {SAMPLE_REPORT_RANGE} (한 달)</li>
          <li><strong className="text-ink">포함</strong>: 알림장·관찰일지 약 20일치</li>
        </ul>
      </InputCard>

      <div className="bg-paper rounded-2xl shadow-card p-6 space-y-4">
        <HintBox>
          {!shown
            ? "‘생성하기’를 눌러보세요. 한 달간의 누적 기록이 7개 섹션의 종합 리포트로 정리돼요."
            : "다시 눌러서 결과를 확인할 수 있어요."}
        </HintBox>
        <GenerateButton
          loading={loading}
          onClick={run}
          accent="navy"
          label="성장 리포트 만들기"
        />
      </div>

      {shown && (
        <ResultCard
          title={`${SAMPLE_REPORT_KID_NAME} · ${SAMPLE_REPORT_RANGE} 성장 리포트`}
          accent="navy"
        >
          <div className="space-y-3">
            {REPORT_SECTION_LABELS.map(({ key, label }) => (
              <div key={key}>
                <h4 className="text-xs font-semibold text-navy-700 mb-1 tracking-wide">
                  {label}
                </h4>
                <p className="text-sm leading-relaxed text-ink-soft bg-[var(--page-accent-50)] border-l-2 border-navy-300 rounded-2xl p-3.5 whitespace-pre-wrap">
                  {SAMPLE_REPORT[key]}
                </p>
              </div>
            ))}
          </div>
        </ResultCard>
      )}
    </div>
  );
}
