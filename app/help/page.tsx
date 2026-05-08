import Link from "next/link";
import { PageHeader } from "../components/PageHeader";
import { Card } from "../components/Card";
import {
  AlrimIllust,
  GwanchalIllust,
  ParentIllust,
  PlayIllust,
  ReportIllust,
} from "../components/illustrations";

export const metadata = {
  title: "사용 설명서 — 쌤노트",
};

const FEATURES = [
  {
    title: "오늘 기록 (알림장·관찰일지)",
    href: "/",
    accent: "coral" as const,
    Illust: AlrimIllust,
    items: [
      "한 번 등록한 명단은 매일 다시 입력하지 않아도 돼요.",
      "출석 칩을 탭해서 오늘 출석한 아이만 골라낼 수 있어요.",
      "식사·기분·낮잠 토글과 짧은 메모만 입력하면 모든 아이의 알림장을 한 번에 만들어요.",
      "관찰일지 모드는 누리과정 영역과 발달적 의미·교사 지원 방향까지 포함된 전문 기록을 만들어요.",
    ],
  },
  {
    title: "학부모 답변 도우미",
    href: "/parent",
    accent: "mustard" as const,
    Illust: ParentIllust,
    items: [
      "학부모님 메시지를 그대로 붙여넣고 상황(갈등·다침·건강 등)을 골라요.",
      "교사가 본 상황을 한두 줄 적어주면 더 정확한 답변이 만들어져요.",
      "공감 → 객관적 상황 → 다음 행동 순서로 답변 초안이 생성됩니다.",
    ],
  },
  {
    title: "놀이기록",
    href: "/play",
    accent: "lavender" as const,
    Illust: PlayIllust,
    items: [
      "놀이 사진(아이 얼굴 비식별 권장)과 짧은 메모만 올리면 누리과정 연결 놀이기록이 만들어져요.",
      "사진은 자동으로 1280px·JPEG로 압축되며, 서버에 저장되지 않고 즉시 폐기됩니다.",
      "결과는 7가지 섹션(주제·흐름·반응·배움·교사 지원·확장·가정 연계)으로 구성됩니다.",
    ],
  },
  {
    title: "성장 리포트",
    href: "/reports",
    accent: "navy" as const,
    Illust: ReportIllust,
    items: [
      "오늘 기록에 누적된 알림장·관찰일지를 종합해 월간 성장 리포트를 만들어요.",
      "아이를 고르고 기간을 선택한 뒤 만들기 버튼을 누르면 7-섹션 리포트가 만들어집니다.",
      "리포트는 학부모 면담 자료·학기말 보고에도 그대로 활용할 수 있어요.",
    ],
  },
];

export default function HelpPage() {
  return (
    <main className="pb-28 lg:pb-12">
      <div className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8 pt-5 md:pt-7 space-y-5 md:space-y-6">
        <PageHeader
          title="사용 설명서"
          description="쌤노트의 핵심 기능을 1분 안에 익혀보세요. 더 자세한 설명은 각 페이지의 안내 문구를 참고해 주세요."
          accent="neutral"
        />

        <Card>
          <h2 className="font-extrabold text-[1.125rem] text-ink tracking-[-0.02em] mb-3">
            시작하기 전에
          </h2>
          <ol className="space-y-2 list-decimal pl-5 text-sm text-ink-secondary leading-relaxed">
            <li>
              <Link href="/settings" className="text-coral font-bold hover:underline">
                설정
              </Link>{" "}
              페이지에서 사용할 AI 프로바이더(Claude / OpenAI / Gemini)를 고르고
              본인의 API 키를 등록하세요.
            </li>
            <li>
              키는 이 기기의 브라우저(localStorage)에만 저장되고 저희 서버에는
              저장되지 않아요.
            </li>
            <li>
              모든 기록(알림장·관찰일지·학부모 답변·놀이기록)도 이 기기의
              IndexedDB에 저장됩니다. 기기를 옮길 땐 설정 → 데이터 관리에서
              내보내기/가져오기를 사용하세요.
            </li>
          </ol>
        </Card>

        {FEATURES.map((f) => (
          <Card key={f.href}>
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-16 h-16">
                <f.Illust />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-extrabold text-[1.125rem] text-ink tracking-[-0.02em] mb-2">
                  <Link href={f.href} className="hover:underline">
                    {f.title}
                  </Link>
                </h2>
                <ul className="space-y-1.5 list-disc pl-5 text-sm text-ink-secondary leading-relaxed">
                  {f.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        ))}

        <Card>
          <h2 className="font-extrabold text-[1.125rem] text-ink tracking-[-0.02em] mb-3 flex items-center gap-2">
            <GwanchalIllust size={32} />
            알림장 vs 관찰일지의 차이
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm leading-relaxed">
            <div className="bg-coral-bg/50 border border-coral-light/30 rounded-xl p-4">
              <div className="font-extrabold text-coral mb-2">📝 알림장</div>
              <ul className="space-y-1 list-disc pl-5 text-ink-secondary">
                <li>1인칭 편지체 (~답니다, ~보냈어요)</li>
                <li>3~7문장의 짧고 따뜻한 톤</li>
                <li>매일 키즈노트·카톡으로 보내는 일일 기록</li>
              </ul>
            </div>
            <div className="bg-sage-bg/50 border border-sage-light/30 rounded-xl p-4">
              <div className="font-extrabold text-sage mb-2">📋 관찰일지</div>
              <ul className="space-y-1 list-disc pl-5 text-ink-secondary">
                <li>3인칭 객관 서술 (~관찰됨, ~보임)</li>
                <li>10~14문장의 전문적 기록</li>
                <li>누리과정 영역 명시 + 교사 지원 방향 포함</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="font-extrabold text-[1.125rem] text-ink tracking-[-0.02em] mb-3">
            안전·개인정보 안내
          </h2>
          <ul className="space-y-1.5 list-disc pl-5 text-sm text-ink-secondary leading-relaxed">
            <li>
              AI 결과물은 항상 <strong className="text-ink">초안</strong>입니다.
              학부모님께 보내기 전에 반드시 선생님이 검토해 주세요.
            </li>
            <li>
              진단·평가적 표현, 다른 아이 이름은 자동으로 걸러지지만 100% 보장되지
              않습니다.
            </li>
            <li>놀이기록의 사진은 서버에 저장되지 않고 생성 후 즉시 폐기됩니다.</li>
            <li>공용 PC에서 사용한 경우 작업 후 설정에서 모두 초기화하세요.</li>
          </ul>
        </Card>

        <footer className="text-center text-xs text-ink-tertiary pt-4">
          쌤노트 · 선생님의 1시간을 돌려드립니다
        </footer>
      </div>
    </main>
  );
}
