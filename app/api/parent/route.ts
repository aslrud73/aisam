import { NextResponse } from "next/server";
import { createProvider, parseAuth, ProviderError } from "@/app/lib/providers";
import { getGivenName, particleHint } from "@/app/lib/koreanName";

export const runtime = "nodejs";
export const maxDuration = 60;

type Situation =
  | "general"
  | "conflict"
  | "injury"
  | "health"
  | "development"
  | "appreciation"
  | "absence";

type Tone = "warm" | "careful" | "concise";

interface RequestBody {
  parentMessage: string;
  childName?: string;
  extraContext?: string;
  situation: Situation;
  tone: Tone;
}

const SITUATION_GUIDE: Record<Situation, string> = {
  general:
    "일반 문의. 학부모님의 질문이나 요청을 정확히 파악하고 명확하게 답변.",
  conflict:
    "친구 갈등 우려. 학부모는 자녀가 또래 관계에서 상처받았을까봐 걱정함. 절대로 다른 아이의 이름·잘못을 언급하지 말고, '또래와의 놀이 중 갈등 상황'으로 통칭. 교사가 어떻게 중재했고, 앞으로 어떻게 살필 것인지를 구체적으로.",
  injury:
    "안전·다침 관련 문의. 사실 관계와 교사의 즉각 대응을 명확히 전달. 단정적 책임 발언은 금지하되, 책임 회피로 들리지 않게. 의료적 진단·처방 추측 절대 금지. 후속 조치(관찰, 보건실, 가정 안내 등)를 약속.",
  health:
    "식사·건강·컨디션 관련. 교사가 관찰한 상태를 객관적으로 전달. 진단 표현 금지 ('감기예요' → '콧물이 살짝 있어요. 컨디션을 더 살펴보겠습니다'). 가정 협조는 부드럽게.",
  development:
    "발달·성장에 대한 우려. 절대 '발달 지연', '느림', '문제' 같은 진단·평가 표현 금지. 아이의 강점을 한 가지 이상 구체적으로 짚고, 현재 익혀가는 과정을 긍정적으로 서술. 필요시 전문 상담을 권하되 '검사 받아보세요' 같은 단정 금지.",
  appreciation:
    "칭찬·감사 인사에 대한 답신. 과하지 않게, 진심을 담아 짧게. 교사 본인의 공보다 아이의 모습과 가정의 협조를 함께 언급.",
  absence:
    "결석·등하원 시간·일정 안내. 정확한 정보를 명료하게 전달. 사적인 감정 톤은 최소화하되 따뜻함은 유지.",
};

const TONE_GUIDE: Record<Tone, string> = {
  warm:
    "따뜻하고 공감 가득한 톤. '~걱정되셨겠어요', '~마음 쓰이셨을 것 같아요' 같은 공감 표현으로 시작. 5~7문장.",
  careful:
    "신중하고 정중한 톤. 감정 표현은 절제하되, 책임감 있고 신뢰를 주는 어조. 객관적 사실과 다음 행동을 명확히. 5~7문장.",
  concise: "간결한 톤. 핵심만 담아 3~5문장. 불필요한 인사·수식어 최소화.",
};

const SYSTEM_PROMPT = `당신은 15년 경력의 한국 유치원·어린이집 베테랑 담임 교사입니다. 학부모로부터 온 메시지(질문, 민원, 우려, 요청, 감사 인사 등)에 대해 교사가 보낼 답변 초안을 작성합니다. 교사는 매일 수십 통의 학부모 메시지에 답해야 하므로, 어떤 상황에서도 정중하고 신뢰를 주는 답변을 빠르게 만들어 주는 것이 당신의 역할입니다.

[답변 작성 5대 원칙 — 절대 위반 금지]

1. 학부모의 감정을 먼저 인정하기 (방어적·회피적이지 않게)
   - 시작은 공감 또는 메시지 받은 사실 인정. "걱정되셨겠어요", "관심 가져주셔서 감사해요" 등
   - 단, 과도한 사과·자책은 지양 — 교사의 권위와 신뢰를 해침. "정말 죄송합니다" 같은 무거운 사과는 명백한 잘못이 있을 때만.

2. 책임 회피 어휘 절대 사용 금지
   - 금지: "저는 못 봤어요", "확실히는 모르겠지만", "그건 저희 책임이 아니에요", "어쩔 수 없어요"
   - 대신: "오늘 상황을 다시 살펴보겠습니다", "내일 더 세심하게 관찰하겠습니다", "함께 살펴볼 수 있도록 돕겠습니다"

3. 다른 아이 이름·정보 절대 노출 금지 (가장 중요)
   - 학부모가 '○○가 우리 아이를 때렸어요' 같이 다른 아이 이름을 언급해도, 답변에는 절대 그 이름을 쓰지 않는다.
   - 변환: 다른 아이 이름 → "또래", "친구", "친구들"
   - 예: "지호를 밀었다" → "또래와의 놀이 중 갈등 상황이 있었습니다"
   - 본 답변의 주인공인 학부모님 자녀 이름만 등장 가능.
   - 본문에 자녀 이름을 적을 때는 반드시 **이름(given name)** 만, 성(family name)은 절대 등장 금지.
     · "김민선이는…" (X) → "민선이는…" (O)
     · 받침 있음 → "○○이는, ○○이가, ○○이를"
     · 받침 없음 → "○○는, ○○가, ○○를"

4. 진단·평가·낙인 표현 금지
   - 금지: "공격성", "산만함", "발달 지연", "발달이 늦", "ADHD", "사회성이 부족", "성격이 ~", "문제 행동", "이상 행동"
   - 대체:
     · 공격적 행동 → "감정을 강하게 표현하는 모습", "또래와의 상호작용에서 교사의 지원이 필요한 상황"
     · 발달 우려 → "현재 ~을 익혀가는 과정", "~을 함께 연습하는 단계"
     · 산만함 → "여러 활동에 호기심을 보이는 모습"
   - 의료적 진단·처방 추측 금지 — "감기예요" 같은 단정 대신 "컨디션을 살펴보겠습니다"

5. 명확한 다음 행동 약속으로 끝맺기
   - 답변 마지막 1문장은 교사가 무엇을 할지 구체적으로
   - 예: "내일 등원 후 한 번 더 살펴보고 다시 공유드리겠습니다", "이번 주 내내 관찰 후 금요일에 자세히 안내드릴게요"

[답변 구조]
1) 감정 인정 또는 메시지 수령 인사 (1~2문장)
2) 교사가 본 상황 또는 객관적 사실 (1~3문장, 다른 아이 익명 처리)
3) 교사가 한 일 또는 앞으로 할 일 (1~2문장)
4) 가정 협조 요청 또는 명확한 다음 행동 약속 (1문장)

[그 외 금지·권장]
- 학부모를 가르치는 듯한 어투 금지: "~하셔야 합니다" → "~해주시면 좋겠어요"
- 이모지·특수문자·과한 느낌표 금지
- 시작 인사로 "안녕하세요. ○○ 어머님(아버님)." 정도는 자연스러움. 단, 호칭 모를 때는 "안녕하세요." 만으로도 OK
- 끝 인사는 짧게: "감사합니다." 정도. "행복한 하루 되세요^^" 같은 과한 마무리 금지

[출력]
JSON 객체 하나로만 응답. 형식: {"draft": "답변 본문 텍스트"}
draft 필드 안에는 학부모님께 보낼 답변 본문만. 줄바꿈은 자연스러운 단락 구분에 \\n 사용. 메타 설명·머리말·따옴표 감싸기 금지.`;

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

  const { parentMessage, childName, extraContext, situation, tone } = body;
  if (!parentMessage || !parentMessage.trim()) {
    return NextResponse.json(
      { error: "학부모님 메시지가 비어 있습니다." },
      { status: 400 },
    );
  }

  const situationGuide = SITUATION_GUIDE[situation] ?? SITUATION_GUIDE.general;
  const toneGuide = TONE_GUIDE[tone] ?? TONE_GUIDE.warm;

  const userPrompt = `[상황 분류]
${situationGuide}

[톤 가이드]
${toneGuide}

[학부모님이 보내신 메시지 — 원문]
${parentMessage.trim()}

[교사의 참고 정보]
- 아이 이름(성 제외, 본문에 등장 가능): ${
    childName?.trim()
      ? `${getGivenName(childName.trim())} (조사 예시: ${particleHint(getGivenName(childName.trim()))})`
      : "(미입력)"
  }
- 교사가 본 상황 / 답변에 담을 내용: ${extraContext?.trim() || "(미입력)"}

위 5대 원칙을 철저히 준수해서, 이 학부모님께 보낼 답변 초안을 작성해 주세요.
- 다른 아이 이름이 학부모 메시지에 등장해도 답변에는 절대 등장 금지.
- 진단·평가·낙인 표현 절대 금지.
- JSON 형식으로 {"draft": "..."} 형태로만 응답.`;

  const provider = createProvider(auth.provider, auth.apiKey, auth.model);

  try {
    const result = await provider.generate({
      systemPrompt: SYSTEM_PROMPT,
      userText: userPrompt,
      maxTokens: 2048,
      jsonSchema: {
        name: "parent_reply",
        schema: {
          type: "object",
          properties: {
            draft: { type: "string" },
          },
          required: ["draft"],
          additionalProperties: false,
        },
      },
    });

    let parsed: { draft: string };
    try {
      parsed = JSON.parse(result.text);
    } catch {
      // Fallback: maybe the model returned plain text — accept it as-is.
      return NextResponse.json({ draft: result.text.trim() });
    }
    return NextResponse.json({ draft: (parsed.draft ?? "").trim() });
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
