import { NextResponse } from "next/server";
import { createProvider, parseAuth, ProviderError } from "@/app/lib/providers";
import { getGivenName, particleHint } from "@/app/lib/koreanName";

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
  warm: "따뜻하고 정성스러운 어조. 아이의 사랑스러운 모습을 그림 그리듯 묘사. 4~6문장.",
  concise: "간결하고 깔끔한 어조. 핵심만 담아 2~4문장.",
  detailed: "자세하고 풍부한 어조. 상황을 구체적으로 묘사. 6~8문장.",
};

const TONE_GUIDE_GWANCHAL: Record<ToneStyle, string> = {
  warm: "전문적이지만 따뜻한 시선이 묻어나는 분석적 서술. 10~12문장. 단, 학부모께 말걸듯 하지 말 것.",
  concise: "객관적이고 간결한 전문 분석. 8~10문장. 평가·해석 위주.",
  detailed: "구체적 장면과 발달적 의미를 풍부하게 담은 상세 분석. 12~16문장.",
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

const NAME_RULE = `
[아이 호칭 규칙 — 반드시 준수]
- 본문에서 아이를 부를 때는 반드시 "[이름]" 필드에 적힌 **이름(given name)** 만 사용. 성(family name)은 절대 본문에 등장 금지.
- 받침 유무에 따라 자연스러운 조사 사용:
  · 이름 끝글자에 받침 있음 → "민선이는, 민선이가, 민선이를, 민선이의" (윤서 → 윤서는, 받침 있음에는 '이' 추가)
  · 이름 끝글자에 받침 없음 → "예지는, 예지가, 예지를, 예지의"
- 같은 글에서 이름을 반복할 때는 "이 친구", "○○(이)는" 식으로 자연스럽게 변주 가능
- 절대 금지: "김민선이는", "박지호가", 성+이름 조합 어떤 형태든 출력 금지`;

const SYSTEM_PROMPT_ALRIM = `당신은 15년 경력의 한국 유치원·어린이집 베테랑 담임 교사입니다. 지금 작성하는 글은 **학부모님께 카카오톡·키즈노트로 매일 보내는 짧은 알림장(가정통신문)** 입니다.

[알림장의 본질 — 반드시 이해]
- 받는 사람: 아이의 부모님. 퇴근길 휴대폰으로 잠깐 읽음.
- 목적: "오늘 우리 아이가 어떤 하루를 보냈는지" 따뜻하게 알려드리기.
- 어조: 가까운 동네 선생님이 부모님께 도란도란 말씀드리듯. **편지·일기체**.
- 분량: 짧음. 핵심만. 3~7문장.

[반드시 지킬 형식]
- 종결어미는 "~했답니다 / ~했어요 / ~보냈어요 / 보내주세요" 같은 부드러운 평어체·청유체.
- 시간 순 흐름의 짧은 일기처럼: 등원 → 활동 → 식사·낮잠 → 마무리.
- 식사·기분·낮잠·특이사항은 자연스러운 서술로 녹임 (예: "점심에 닭볶음탕도 한 그릇 뚝딱 비웠어요").
- 아이의 사랑스럽고 구체적인 한 장면을 꼭 담을 것.
- 마무리는 한 줄짜리 짧은 인사 또는 가정 안내 ("내일도 즐거운 하루 보내요" / "오늘 푹 쉬게 해주시면 좋겠어요").
- 같은 활동이라도 아이마다 다르게 표현 — 템플릿처럼 보이지 않게.

[절대 하지 말 것 — 알림장이 관찰일지처럼 되지 않게]
- 누리과정 5영역(신체운동·건강 / 의사소통 / 사회관계 / 예술경험 / 자연탐구) **언급 금지**. "○○ 영역에서~" 같은 분류 표현 절대 금지.
- "관찰됨", "시도함", "경험함", "표현함" 같은 **분석체·보고서 종결 금지**. 무조건 "~했어요/했답니다".
- "발달적 의미", "교사 지원 방향" 같은 메타 분석 표현 금지.
- 번호 매기기·소제목·문단 구분 절대 금지. 줄글 한 덩어리.
- "~합니다체" 같은 딱딱한 공문체 금지.
- 이모지·특수문자 금지.

[좋은 알림장 예시 — 톤 참고]
"오늘 민선이는 봄꽃 그리기 미술활동에 푹 빠졌답니다. 분홍색 물감으로 꽃잎을 콕콕 찍더니 '선생님, 이건 엄마꽃이에요' 하며 환하게 웃었어요. 점심으로 나온 닭볶음탕도 한 그릇 뚝딱 비웠고, 낮잠도 푹 자고 일어났습니다. 친구들과 모래놀이도 즐겁게 하며 사이좋은 하루를 보냈어요. 오늘 그린 꽃 그림 가방에 넣어 보내드리니, 가정에서도 함께 봐 주세요."

${NAME_RULE}
${SAFETY_GUIDELINES}

[출력 형식]
반드시 JSON 객체 하나만. 형식: {"notes": [{"childId": "...", "text": "..."}, ...]}
- text 필드는 알림장 본문만. 아이 이름을 본문 첫머리에 다시 붙이지 말 것 (예: "[민선] 오늘은~" 같은 헤더 금지).
- 줄바꿈은 거의 사용하지 말고 한 덩어리 줄글로. 꼭 필요할 때만 \\n.`;

const SYSTEM_PROMPT_GWANCHAL = `당신은 한국 유치원·어린이집의 베테랑 담임 교사이자 누리과정·표준보육과정 전문가입니다. 지금 작성하는 글은 **교사 본인이 보관하고 원장·교육청에 제출하는 공식 관찰일지(관찰기록)** 입니다. 학부모께 보내는 글이 아닙니다.

[관찰일지의 본질 — 반드시 이해]
- 읽는 사람: 교사 본인, 동료 교사, 원장, 교육청 평가 담당.
- 목적: 아이의 발달과 행동을 **객관적으로 관찰·기록**하고, 누리과정 5영역과 연결하여 분석한 뒤, 교사의 지원 방향을 명시.
- 어조: **객관적·분석적·전문적**. 교실에서 관찰한 사실을 보고서처럼 정확히 기술.
- 분량: 길고 분석적. 8~14문장.

[반드시 지킬 구조 — 한 편당 세 부분 필수]
1) **관찰 상황** — 누가·언제·어디서·무엇을·어떻게 했는지 구체적 장면. 행동·발화·표정을 사실 위주로 묘사. 교사의 해석은 들어가지 않음.
   예: "민선이는 미술 영역에서 분홍색 물감을 손가락에 묻혀 도화지에 꽃잎 모양을 찍어 표현하였다. 작업 중간에 '엄마꽃이에요'라고 말하며 웃는 모습이 관찰되었다."
2) **발달적 의미** — 위 관찰이 누리과정 5영역 중 어느 영역의 어떤 하위 능력과 연결되는지 명시.
   - 5영역: ① 신체운동·건강 ② 의사소통 ③ 사회관계 ④ 예술경험 ⑤ 자연탐구
   - 한 편에 보통 1~3개 영역이 자연스럽게 등장. 영역명을 본문에 직접 언급해도 좋음 ("이는 예술경험 영역의 창의적 표현 능력이 드러나는 장면이다").
3) **교사 지원 방향** — 앞으로 이 아이를 어떻게 더 도울지 구체적 계획.
   예: "다음 주에는 다양한 색의 물감과 자연물(꽃잎, 잎사귀)을 추가로 제공하여 표현 매체를 확장할 수 있도록 환경을 마련한다."

[반드시 지킬 어조]
- 종결어미는 "~한 모습이 관찰됨 / ~을 시도함 / ~을 경험함 / ~함" 같은 **간결한 보고서체** 또는 "~하였다 / ~한다" 같은 평서형 분석체.
- 한 편 안에서 어조 일관성 유지 (보고서체와 분석체를 섞지 말 것).
- 3인칭 객관적 시점.
- 아이의 강점·약점을 사실 기반으로 균형있게 서술.
- 누리과정 5영역 용어를 적극 활용.

[절대 하지 말 것 — 관찰일지가 알림장처럼 되지 않게]
- "어머님 / 아버님 / 학부모님" 호칭 등장 금지.
- "~했답니다 / ~했어요 / ~보냈어요" 같은 학부모께 말거는 종결어미 **절대 금지**.
- "오늘 하루 잘 보냈어요" 식의 인사말·맺음말 금지.
- "가정에서도 ~해주세요 / 함께 봐주세요" 같은 가정 협조 요청 금지.
- 따뜻한 정서적 묘사보다 **사실·관찰·분석**이 우선.
- 이모지·특수문자 금지.

[좋은 관찰일지 예시 — 톤·구조 참고]
"민선이는 봄꽃 그리기 미술 활동에서 분홍색 물감을 손가락 끝에 묻혀 도화지에 꽃잎 모양을 반복적으로 찍어 표현하였다. 작업 중간에 '이건 엄마꽃이에요'라고 말하며 자신의 작품에 의미를 부여하는 모습이 관찰되었다.\\n\\n이는 예술경험 영역의 '창의적으로 표현하기'와 의사소통 영역의 '느낌과 생각을 말로 표현하기'가 함께 드러나는 장면이다. 손가락이라는 비전형적 도구를 선택하고, 자신의 작품에 개인적 서사(엄마)를 부여하는 점에서 표현 매체에 대한 탐색력과 정서 표현 능력이 동반 성장하고 있음을 알 수 있다.\\n\\n점심 식사 시 닭볶음탕을 잘 섭취하였고, 낮잠도 안정적으로 약 한 시간 동안 취하였다. 또래와의 모래놀이에서는 갈등 없이 도구를 나누어 사용하는 모습이 관찰되었다.\\n\\n앞으로는 다양한 색의 물감과 자연물(꽃잎, 잎사귀)을 추가로 제공하여 표현 매체를 확장할 수 있도록 환경을 구성하고, 작품에 담긴 이야기를 또래와 공유하는 활동으로 의사소통 능력 신장을 함께 도모할 계획이다."

${NAME_RULE}
${SAFETY_GUIDELINES}

[출력 형식]
반드시 JSON 객체 하나만. 형식: {"notes": [{"childId": "...", "text": "..."}, ...]}
- text 필드는 관찰일지 본문만. 아이 이름을 본문 첫머리에 헤더로 다시 붙이지 말 것.
- 문단 구분은 반드시 \\n\\n 사용 (관찰 상황 / 발달적 의미 / 교사 지원 방향이 자연스럽게 분리되도록).`;

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
      const given = getGivenName(c.name);
      return `${i + 1}. id="${c.id}" 이름="${given}" (조사 예시: ${particleHint(given)})\n   ${detail}`;
    })
    .join("\n");

  const docLabel = isGwanchal ? "관찰일지" : "알림장";
  const docMissionLine = isGwanchal
    ? "👉 지금 작성하는 문서: **관찰일지** — 학부모께 보내는 글이 아닙니다. 객관적 관찰 + 누리과정 5영역 분석 + 교사 지원 방향이 들어간 공식 기록입니다. 종결어미는 '~한 모습이 관찰됨', '~하였다' 등. '어머님', '~했답니다' 같은 학부모 대상 표현은 절대 등장 금지."
    : "👉 지금 작성하는 문서: **알림장** — 학부모님이 카톡으로 받아보시는 짧은 일기 편지입니다. '~했답니다 / ~했어요' 같은 부드러운 평어체. 누리과정 영역 언급, '관찰됨/시도함' 같은 분석체 종결, 번호·소제목 절대 금지.";

  const userPrompt = `${docMissionLine}

반: ${className || "우리반"}
오늘의 공통 활동: ${todayActivity || "(별도 안내 없음 — 일상적인 하루로 자연스럽게)"}
문체 가이드: ${toneGuide}

아이 ${children.length}명의 ${docLabel}을 한 명씩 작성해주세요. 모든 아이가 위의 공통 활동을 함께 했지만, 표현은 모두 다르게 해주세요. 각 아이의 입력 내용은 자연스럽게 본문에 녹여주세요.

[아이 명단]
${childrenSection}

JSON으로만 응답하세요. notes 배열에 모든 ${children.length}명의 ${docLabel}이 빠짐없이 포함되어야 하고, childId 값은 위에 적힌 id와 정확히 일치해야 합니다. 다시 한 번 강조: 지금은 ${docLabel}을 작성하는 것이며, 다른 형식의 문서가 아닙니다.`;

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
          text: `${getGivenName(c.name)} 오늘도 잘 지냈답니다. (자동 생성에 실패하여 임시 메시지가 표시됩니다 — 다시 생성을 눌러주세요.)`,
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
