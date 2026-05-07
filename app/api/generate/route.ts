import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

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
  tone: "warm" | "concise" | "detailed";
  children: ChildEntry[];
}

const TONE_GUIDE: Record<RequestBody["tone"], string> = {
  warm: "따뜻하고 정성스러운 어조. 아이의 사랑스러운 모습을 그림 그리듯 묘사. 5~7문장.",
  concise: "간결하고 깔끔한 어조. 핵심만 담아 3~4문장.",
  detailed: "자세하고 풍부한 어조. 상황을 구체적으로 묘사. 7~10문장.",
};

const SYSTEM_PROMPT = `당신은 15년 경력의 한국 유치원·어린이집 베테랑 담임 교사입니다. 매일 학부모에게 보내는 알림장(가정통신문)을 작성하는 일을 합니다.

알림장 작성 원칙:
- 학부모님께 보내는 글이므로 정중한 존댓말 ("~했답니다", "~했어요", "~보냈답니다" 같은 부드러운 종결어미 활용)
- 아이를 3인칭으로 부를 때는 "○○이/가" 형태로 자연스럽게
- 같은 활동이라도 아이마다 표현을 다르게 — 절대 템플릿처럼 보이지 않게
- 식사/기분/낮잠/특이사항을 모두 자연스럽게 녹여서 한 편의 짧은 일기처럼
- 아이의 강점과 사랑스러운 면을 구체적인 장면으로 포착
- 부정적인 내용도 따뜻하게 (예: "안먹음" → "오늘은 입맛이 없었는지 평소보다 적게 드셨어요. 내일은 더 맛있게 먹을 수 있도록 격려해주세요.")
- 마지막에 짧은 인사나 가정에서의 안내 한 줄
- 이모지나 특수문자 사용 금지
- 절대 "~합니다체" 같이 딱딱한 어투는 쓰지 않기

출력 형식: 반드시 JSON 객체 하나만. 다음 형식을 정확히 따를 것:
{"notes": [{"childId": "...", "text": "..."}, ...]}
text 필드 안에는 알림장 본문만. 아이 이름을 본문 첫머리에 다시 붙이지 말 것. 줄바꿈은 \\n 으로.`;

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다." },
      { status: 500 },
    );
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const { className, todayActivity, tone, children } = body;
  if (!Array.isArray(children) || children.length === 0) {
    return NextResponse.json(
      { error: "아이 명단이 비어 있습니다." },
      { status: 400 },
    );
  }

  const childrenSection = children
    .map((c, i) => {
      const e = c.entry ?? {};
      const parts: string[] = [];
      if (e.meal) parts.push(`식사: ${e.meal}`);
      if (e.mood) parts.push(`기분: ${e.mood}`);
      if (e.nap) parts.push(`낮잠: ${e.nap}`);
      if (e.memo) parts.push(`특이사항: ${e.memo}`);
      const detail = parts.length ? parts.join(" · ") : "(특별한 입력 없음 — 평소대로 잘 지냈음으로 자연스럽게 작성)";
      return `${i + 1}. id="${c.id}" 이름="${c.name}"\n   ${detail}`;
    })
    .join("\n");

  const userPrompt = `반: ${className || "우리반"}
오늘의 공통 활동: ${todayActivity || "(별도 안내 없음 — 일상적인 하루로 자연스럽게)"}
문체 가이드: ${TONE_GUIDE[tone] ?? TONE_GUIDE.warm}

아이 ${children.length}명의 알림장을 한 명씩 작성해주세요. 각 아이 모두 위의 공통 활동을 함께 했지만, 표현은 모두 다르게 해주세요. 각 아이의 식사·기분·낮잠·특이사항은 자연스럽게 본문에 녹여주세요.

[아이 명단]
${childrenSection}

JSON으로만 응답하세요. children 배열의 모든 ${children.length}명에 대해 빠짐없이 작성하고, childId 값은 위에 적힌 id 와 정확히 일치해야 합니다.`;

  const client = new Anthropic();

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userPrompt }],
      output_config: {
        format: {
          type: "json_schema",
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
      },
    });

    const textBlock = response.content.find(
      (b): b is Anthropic.TextBlock => b.type === "text",
    );
    if (!textBlock) {
      return NextResponse.json(
        { error: "AI 응답이 비어 있습니다. 다시 시도해 주세요." },
        { status: 502 },
      );
    }

    let parsed: { notes: Array<{ childId: string; text: string }> };
    try {
      parsed = JSON.parse(textBlock.text);
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
          text: `${c.name}이 오늘 하루도 건강하게 잘 지냈답니다. (자동 생성에 실패하여 임시 메시지가 표시됩니다 — 다시 생성을 눌러주세요.)`,
        });
      }
    }

    return NextResponse.json({ notes });
  } catch (e) {
    if (e instanceof Anthropic.APIError) {
      const message =
        e.status === 401
          ? "API 키가 유효하지 않습니다."
          : e.status === 429
            ? "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요."
            : `AI 호출 중 오류가 발생했습니다 (${e.status}).`;
      return NextResponse.json({ error: message }, { status: e.status ?? 500 });
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "알 수 없는 오류" },
      { status: 500 },
    );
  }
}
