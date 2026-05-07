import { NextResponse } from "next/server";
import { createProvider, parseAuth, ProviderError } from "@/app/lib/providers";

export const runtime = "nodejs";
export const maxDuration = 60;

type DocType = "alrim" | "gwanchal";
type ToneStyle = "warm" | "concise" | "detailed";

interface ChildEntry {
  id: string;
  name: string;
  entry: {
    meal: string;
    mood: string;
    nap: string;
    memo: string;
  };
}

interface RequestBody {
  className: string;
  todayActivity: string;
  tone: ToneStyle;
  docType: DocType;
  children: ChildEntry[];
}

const TONE_GUIDE_ALRIM: Record<ToneStyle, string> = {
  warm: "따뜻하고 정성스러운 어조. 아이의 사랑스러운 모습을 그림 그리듯 묘사. 5~7문장.",
  concise: "간결하고 깔끔한 어조. 핵심만 담아 3~4문장.",
  detailed: "자세하고 풍부한 어조. 상황을 구체적으로 묘사. 7~10문장.",
};

const TONE_GUIDE_GWANCHAL: Record<ToneStyle, string> = {
  warm: "전문적이지만 따뜻한 시선이 묻어나는 서술. 8~10문장.",
  concise: "객관적이고 간결한 전문 서술. 6~8문장.",
  detailed: "구체적인 장면과 발달적 의미를 풍부하게 담은 상세 서술. 10~14문장.",
};

const SAFETY_GUIDELINES = `
[안전·윤리 가이드라인 — 절대 준수]

1. 진단적·평가적 표현 금지
   - 절대 사용 금지 단어/표현: "공격성", "공격적", "문제 행동", "발달 지연", "발달이 늦", "ADHD", "자폐", "산만함", "주의력 부족", "사회성이 부족", "성격이 ~하다", "이상 행동", "비정상", "기질이 ~"
   - 권장 대체 표현:
     · 공격적 행동 → "감정을 강하게 표현하는 모습", "또래와의 상호작용에서 교사의 언어적 지원이 필요한 상황"
     · 발달 지연/늦음 → "현재 ~을 익히는 과정에 있는 모습", "~을 함께 연습해 나가고 있어요"
     · 산만함/주의력 → "다양한 관심사를 보이는 모습", "여러 활동에 호기심을 보이는 모습"
     · 사회성 부족 → "또래와 관계 맺는 방식을 자신만의 속도로 배워가는 모습"
     · 문제 행동 → "도움이 필요했던 상황", "교사의 중재가 필요했던 순간"

2. 다른 아이 이름·정보 노출 절대 금지
   - 입력에 다른 아이 이름이 등장해도 (예: "민준이가 지호를 밀었어요"), 출력에는 절대 다른 아이 이름을 쓰지 않는다.
   - 변환 예시:
     · "지호를 밀었어요" → "또래와의 놀이 중 갈등 상황이 있었습니다"
     · "윤서가 양보 안 해줘서 울었어요" → "친구와 차례를 기다리는 과정에서 속상한 감정을 표현했어요"
   - 본 알림장/관찰일지의 주인공 아이 이름만 등장 가능. 다른 모든 아이는 "또래", "친구", "친구들"로 통칭.

3. 부정적 상황의 따뜻한 재해석
   - 다치거나 우는 등의 상황도 비난·낙인 없이, 사실 + 교사의 대응 + 발달적 의미 순으로 서술
   - 가정 협조 요청은 부드럽게 ("~해주세요" 대신 "~해주시면 좋겠어요", "~함께 살펴봐주세요")

4. 의료·법적 판단 금지
   - 증상에 대한 진단/처방 추측 금지 ("감기인 것 같아요" → "콧물이 조금 있어요. 가정에서도 살펴봐주세요")
   - 안전사고 단정적 책임 서술 금지`;

const SYSTEM_PROMPT_ALRIM = `당신은 15년 경력의 한국 유치원·어린이집 베테랑 담임 교사입니다. 매일 학부모에게 보내는 알림장(가정통신문)을 작성합니다.

[알림장 작성 원칙]
- 학부모님께 보내는 글: 정중하고 부드러운 종결어미 ("~했답니다", "~했어요", "~보냈답니다")
- 아이를 3인칭으로: "○○이/가" 자연스럽게
- 같은 활동이라도 아이마다 표현을 다르게 — 절대 템플릿처럼 보이지 않게
- 식사·기분·낮잠·특이사항을 자연스럽게 한 편의 짧은 일기처럼
- 아이의 강점과 사랑스러운 면을 구체적인 장면으로 포착
- 마지막에 짧은 인사나 가정에서의 안내 한 줄
- 이모지·특수문자 사용 금지
- 절대 "~합니다체" 같은 딱딱한 어투는 쓰지 않기
${SAFETY_GUIDELINES}

[출력 형식]
반드시 JSON 객체 하나만. 형식: {"notes": [{"childId": "...", "text": "..."}, ...]}
text 필드 안에는 알림장 본문만. 아이 이름을 본문 첫머리에 다시 붙이지 말 것. 줄바꿈은 \\n.`;

const SYSTEM_PROMPT_GWANCHAL = `당신은 한국 유치원·어린이집의 베테랑 담임 교사이자 누리과정·표준보육과정 전문가입니다. 매주 작성하는 관찰일지(관찰기록)를 객관적이고 전문적인 어조로 작성합니다.

[관찰일지 작성 원칙]
- 객관적 서술 우선: 교사의 해석보다 관찰된 행동·상황을 먼저 묘사한 뒤 발달적 의미를 해석
- 누리과정 5영역과 자연스럽게 연결:
  1. 신체운동·건강 (대근육·소근육 활동, 안전, 건강한 생활습관)
  2. 의사소통 (듣기·말하기, 읽기·쓰기에 관심, 책과 이야기 즐기기)
  3. 사회관계 (자기 존중, 더불어 생활, 또래·교사와의 관계)
  4. 예술경험 (아름다움 찾기, 창의적 표현, 예술 감상)
  5. 자연탐구 (탐구 과정 즐기기, 수학적·과학적 탐구)
- 본문 구조: ① 관찰 상황(구체적 장면) → ② 발달적 의미(어떤 영역의 어떤 능력이 드러났는지) → ③ 교사 지원 방향(앞으로 어떻게 도울 것인지)
- 어조: 전문적, 서술적, 학습 과정 중심. "~한 모습이 관찰됨", "~을 경험함", "~을 시도함" 등 서술형 종결 활용 가능 (단, 한 문서 내에서 어조 일관성 유지)
- 아이를 칭하는 방식: "○○이/가" 또는 영아의 경우 "○○"
${SAFETY_GUIDELINES}

[출력 형식]
반드시 JSON 객체 하나만. 형식: {"notes": [{"childId": "...", "text": "..."}, ...]}
text 필드 안에는 관찰일지 본문만. 아이 이름을 본문 첫머리에 다시 붙이지 말 것. 줄바꿈은 \\n. 본문 안에 자연스러운 문단 구분은 \\n\\n으로.`;

export async function POST(req: Request) {
  let auth;
  try {
    auth = parseAuth(req);
  } catch (e) {
    if (e instanceof ProviderError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { className, todayActivity, tone, docType, children } = body;
  if (!Array.isArray(children) || children.length === 0) {
    return NextResponse.json(
      { error: "아이 명단이 비어 있습니다." },
      { status: 400 },
    );
  }

  const isGwanchal = docType === "gwanchal";
  const systemPrompt = isGwanchal ? SYSTEM_PROMPT_GWANCHAL : SYSTEM_PROMPT_ALRIM;
  const toneGuide = isGwanchal
    ? (TONE_GUIDE_GWANCHAL[tone] ?? TONE_GUIDE_GWANCHAL.warm)
    : (TONE_GUIDE_ALRIM[tone] ?? TONE_GUIDE_ALRIM.warm);

  const childrenSection = children
    .map((c, i) => {
      const e = c.entry ?? {};
      const parts: string[] = [];
      if (e.meal) parts.push(`식사: ${e.meal}`);
      if (e.mood) parts.push(`기분: ${e.mood}`);
      if (e.nap) parts.push(`낮잠: ${e.nap}`);
      if (e.memo) parts.push(`관찰 메모: ${e.memo}`);
      const fallback = isGwanchal
        ? "(특별한 입력 없음 — 오늘의 공통 활동 안에서 자연스럽게 관찰될 수 있는 모습으로 작성)"
        : "(특별한 입력 없음 — 평소대로 잘 지냈음으로 자연스럽게 작성)";
      const detail = parts.length ? parts.join(" · ") : fallback;
      return `${i + 1}. id="${c.id}" 이름="${c.name}"\n   ${detail}`;
    })
    .join("\n");

  const docLabel = isGwanchal ? "관찰일지" : "알림장";
  const userPrompt = `반: ${className || "우리반"}
오늘의 공통 활동: ${todayActivity || "(별도 안내 없음 — 일상적인 하루로 자연스럽게)"}
문체 가이드: ${toneGuide}

아이 ${children.length}명의 ${docLabel}을 한 명씩 작성해주세요. 모든 아이가 위의 공통 활동을 함께 했지만, 표현은 모두 다르게 해주세요. 각 아이의 입력 내용은 자연스럽게 본문에 녹여주세요.

[아이 명단]
${childrenSection}

JSON으로만 응답하세요. notes 배열에 모든 ${children.length}명의 ${docLabel}이 빠짐없이 포함되어야 하고, childId 값은 위에 적힌 id와 정확히 일치해야 합니다.`;

  const provider = createProvider(auth.provider, auth.apiKey, auth.model);

  try {
    const result = await provider.generate({
      systemPrompt,
      userText: userPrompt,
      maxTokens: 16000,
      jsonSchema: {
        name: "daily_notes",
        schema: {
          type: "object",
          properties: {
            notes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  childId: { type: "string" },
                  text: { type: "string" },
                },
                required: ["childId", "text"],
                additionalProperties: false,
              },
            },
          },
          required: ["notes"],
          additionalProperties: false,
        },
      },
    });

    let parsed: { notes: Array<{ childId: string; text: string }> };
    try {
      parsed = JSON.parse(result.text);
    } catch {
      return NextResponse.json(
        { error: "AI 응답을 파싱하지 못했습니다. 다시 시도해 주세요." },
        { status: 502 },
      );
    }

    const validIds = new Set(children.map((c) => c.id));
    const notes = (parsed.notes ?? []).filter((n) => validIds.has(n.childId));
    const present = new Set(notes.map((n) => n.childId));
    for (const c of children) {
      if (!present.has(c.id)) {
        notes.push({
          childId: c.id,
          text: `${c.name}이/가 오늘도 잘 지냈답니다. (자동 생성에 실패하여 임시 메시지가 표시됩니다 — 다시 생성을 눌러주세요.)`,
        });
      }
    }

    return NextResponse.json({ notes });
  } catch (e) {
    if (e instanceof ProviderError) {
      return NextResponse.json(
        { error: e.message },
        { status: e.status === 401 ? 401 : e.status === 429 ? 429 : 500 },
      );
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "알 수 없는 오류" },
      { status: 500 },
    );
  }
}
