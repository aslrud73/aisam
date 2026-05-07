import { NextResponse } from "next/server";
import { createProvider, parseAuth, ProviderError } from "@/app/lib/providers";

export const runtime = "nodejs";
export const maxDuration = 90;

interface EntryInput {
  date: string;
  docType: "alrim" | "gwanchal";
  meal?: string;
  mood?: string;
  nap?: string;
  memo?: string;
  todayActivity?: string;
  text: string;
}

interface RequestBody {
  kidName: string;
  monthLabel: string; // e.g. "2026년 5월"
  entries: EntryInput[];
}

const SYSTEM_PROMPT = `당신은 한국 유치원·어린이집의 베테랑 담임 교사이자 누리과정·표준보육과정 전문가입니다. 한 아이의 한 달치 알림장·관찰일지를 종합하여, 학부모님께 전달할 수 있는 따뜻하고 전문적인 월간 성장 리포트를 작성합니다.

[월간 리포트 7개 섹션 — 모두 빠짐없이 작성]

1. 인사말 (intro)
   - 학부모님께 보내는 따뜻한 인사로 시작 (2~3문장).
   - 이번 달 아이의 전반적인 인상을 한 줄로 요약.

2. 이번 달 관심 놀이 (interests)
   - 입력 데이터에서 반복적으로 등장한 놀이·활동·관심사를 묶어 서술 (3~5문장).
   - "관찰된 모습" 중심으로, 단정·평가 없이.

3. 또래 관계의 변화 (peerRelations)
   - 또래와의 상호작용 패턴, 함께 놀이한 모습, 갈등 해결 모습 (3~5문장).
   - 다른 아이 이름 절대 노출 금지 — "또래", "친구"로 통칭.

4. 언어 표현 특징 (language)
   - 의사소통 영역에서 관찰된 모습 (3~4문장).
   - 듣기·말하기·이야기 만들기·책에 대한 관심 등.

5. 신체 활동과 정서 표현 (bodyAndEmotion)
   - 대근육·소근육 활동, 신체적 도전, 감정 표현 방식 (3~5문장).
   - 식사·낮잠·컨디션 패턴이 있다면 함께 언급.

6. 교사의 지원 내용 (teacherSupport)
   - 이번 달 교사가 어떻게 지원했는지 구체적으로 (3~4문장).
   - "교사가 ~하도록 도왔습니다", "~할 수 있도록 환경을 마련했습니다" 등.

7. 다음 달 가정 연계 제안 (homeConnection)
   - 가정에서 함께해볼 수 있는 활동 2~3개 구체적으로 (4~6문장).
   - 부드러운 종결어미. "~해보시면 좋겠어요", "~함께 해보세요".

[안전·윤리 가이드라인 — 절대 위반 금지]

- 진단·평가·낙인 표현 절대 금지: "공격성", "산만함", "발달 지연", "ADHD", "사회성 부족", "문제 행동" 등
- 다른 아이 이름 절대 노출 금지
- 의료적 진단·처방 추측 금지
- 누적 데이터에 부정적 표현이 있어도 따뜻하게 재해석
- 성장의 과정으로, 단정이 아닌 묘사·격려로 서술
- 이모지·특수문자 사용 금지

[출력 형식]
반드시 JSON 객체 하나만. 형식:
{
  "intro": "...",
  "interests": "...",
  "peerRelations": "...",
  "language": "...",
  "bodyAndEmotion": "...",
  "teacherSupport": "...",
  "homeConnection": "..."
}
줄바꿈은 \\n, 단락 구분은 \\n\\n. 메타 설명·머리말 금지.`;

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

  const { kidName, monthLabel, entries } = body;
  if (!kidName || !Array.isArray(entries) || entries.length === 0) {
    return NextResponse.json(
      { error: "리포트를 만들 데이터가 없어요." },
      { status: 400 },
    );
  }

  const entriesText = entries
    .map((e, i) => {
      const meta: string[] = [];
      if (e.meal) meta.push(`식사:${e.meal}`);
      if (e.mood) meta.push(`기분:${e.mood}`);
      if (e.nap) meta.push(`낮잠:${e.nap}`);
      const metaStr = meta.length ? ` [${meta.join(" · ")}]` : "";
      const memo = e.memo ? `\n   메모: ${e.memo}` : "";
      const activity = e.todayActivity ? `\n   활동: ${e.todayActivity}` : "";
      return `[${i + 1}] ${e.date} (${e.docType === "gwanchal" ? "관찰일지" : "알림장"})${metaStr}${activity}${memo}\n   기록: ${e.text}`;
    })
    .join("\n\n");

  const userPrompt = `[아이 이름]
${kidName}

[리포트 대상 기간]
${monthLabel}

[이번 달 누적 기록 ${entries.length}건 — 시간순]

${entriesText}

위 한 달치 기록을 종합하여, 7개 섹션의 월간 성장 리포트를 작성해 주세요. 학부모님께 전달할 글이라는 점을 잊지 말고, 따뜻하고 전문적인 어조로. JSON으로만 응답.

가이드라인 재확인:
- 다른 아이 이름 절대 노출 금지
- 진단·평가·낙인 표현 절대 금지
- 7개 필드 모두 빠짐없이 작성`;

  const provider = createProvider(auth.provider, auth.apiKey, auth.model);

  try {
    const result = await provider.generate({
      systemPrompt: SYSTEM_PROMPT,
      userText: userPrompt,
      maxTokens: 4096,
      jsonSchema: {
        name: "monthly_report",
        schema: {
          type: "object",
          properties: {
            intro: { type: "string" },
            interests: { type: "string" },
            peerRelations: { type: "string" },
            language: { type: "string" },
            bodyAndEmotion: { type: "string" },
            teacherSupport: { type: "string" },
            homeConnection: { type: "string" },
          },
          required: [
            "intro",
            "interests",
            "peerRelations",
            "language",
            "bodyAndEmotion",
            "teacherSupport",
            "homeConnection",
          ],
          additionalProperties: false,
        },
      },
    });

    let parsed;
    try {
      parsed = JSON.parse(result.text);
    } catch {
      return NextResponse.json(
        { error: "AI 응답을 파싱하지 못했습니다. 다시 시도해 주세요." },
        { status: 502 },
      );
    }

    return NextResponse.json({ report: parsed });
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
