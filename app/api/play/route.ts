import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 90;

interface RequestBody {
  images: string[]; // data URLs
  note: string;
  age: string;
  activityName: string;
}

const AGE_LABELS: Record<string, string> = {
  "0-1": "만 0~1세 영아",
  "2": "만 2세",
  "3": "만 3세",
  "4": "만 4세",
  "5": "만 5세",
  mixed: "혼합연령 (영유아 통합반)",
};

// Claude Vision currently supports JPEG, PNG, GIF, WebP.
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
]);

const MAX_IMAGES = 5;
const MAX_TOTAL_BYTES = 20 * 1024 * 1024; // 20MB safety cap across all images

const SYSTEM_PROMPT = `당신은 한국 유치원·어린이집의 베테랑 담임 교사이자 누리과정·표준보육과정 전문가입니다. 교사가 제공한 놀이 사진과 짧은 메모를 바탕으로, 기관에 제출 가능한 수준의 전문적인 놀이기록을 작성합니다.

[놀이기록 7개 섹션 — 모두 빠짐없이 작성]

1. 놀이 주제 (theme)
   - 한 줄로 명확하게. 사진과 메모에서 드러난 핵심 놀이를 포착.
   - 예: "다양한 도구로 봄꽃 표현하기 — 색과 질감의 탐색"

2. 놀이 흐름 (flow)
   - 놀이가 어떻게 시작되어 어떻게 전개되었는지 시간 순으로 서술.
   - 사진에서 관찰 가능한 단서 (도구, 재료, 공간, 자세, 결과물)를 활용.
   - 4~6문장.

3. 유아의 반응 (reactions)
   - 아이들이 어떤 모습·반응을 보였는지 객관적으로 묘사.
   - 표정, 행동, 또래 상호작용, 말 등을 구체적으로.
   - 진단·평가 표현 금지. 다른 아이 이름 노출 금지.
   - 4~6문장.

4. 배움 요소 (learning) — 누리과정 영역과 명시적 연결
   - 다음 5영역 중 이 놀이에서 두드러진 2~4개 영역을 골라 각각 어떤 학습이 일어났는지 서술:
     · 신체운동·건강 / 의사소통 / 사회관계 / 예술경험 / 자연탐구
   - 각 영역명을 본문에 명시할 것.
   - 5~7문장.

5. 교사 지원 (support)
   - 이 놀이에서 교사가 어떻게 지원했는지 또는 지원할 수 있는지.
   - 환경 구성, 언어적 상호작용, 재료 제공 등 구체적으로.
   - 3~5문장.

6. 확장 놀이 (extension)
   - 오늘의 놀이를 어떻게 더 확장·연계할 수 있는지 2~3개 구체적 아이디어.
   - 예: "산책 중 실제 꽃 관찰하기", "꽃잎 색깔별 분류 놀이", "꽃가게 역할놀이로 연결"

7. 가정 연계 문구 (homeConnection)
   - 학부모님께 전달할 한 단락. 따뜻한 종결어미 ("~보냈답니다", "~해보시면 좋아요").
   - 가정에서 함께해볼 수 있는 활동 1~2개 구체적으로 제안.
   - 3~5문장.

[안전·윤리 가이드라인 — 모든 섹션 공통, 절대 위반 금지]

- 진단·평가·낙인 표현 절대 금지: "공격성", "산만함", "발달 지연", "ADHD", "사회성 부족", "문제 행동" 등
- 다른 아이 이름·신원 정보 노출 금지: 사진 속 또는 메모 속 아이는 모두 "유아", "아이", "또래", "친구"로 통칭
- 사진에서 식별 가능한 정보 (이름표, 가방 라벨, 명찰 등)가 있어도 절대 옮겨 적지 말 것
- 의료적 진단·처방 추측 금지
- 이모지·특수문자 사용 금지
- 모든 섹션 어조는 전문적이되 따뜻하게

[출력 형식]
반드시 JSON 객체 하나만. 형식:
{
  "theme": "...",
  "flow": "...",
  "reactions": "...",
  "learning": "...",
  "support": "...",
  "extension": "...",
  "homeConnection": "..."
}
각 필드는 줄바꿈 \\n 으로 단락 구분 가능. 메타 설명·머리말 금지.`;

function parseDataUrl(dataUrl: string): {
  mediaType: string;
  data: string;
  byteLength: number;
} | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  const mediaType = match[1].toLowerCase();
  const data = match[2];
  // base64 byte length ≈ data.length * 3/4 (minus padding)
  const padding = data.endsWith("==") ? 2 : data.endsWith("=") ? 1 : 0;
  const byteLength = Math.floor((data.length * 3) / 4) - padding;
  return { mediaType, data, byteLength };
}

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

  const { images = [], note = "", age = "3", activityName = "" } = body;

  if (images.length > MAX_IMAGES) {
    return NextResponse.json(
      { error: `사진은 최대 ${MAX_IMAGES}장까지 첨부할 수 있어요.` },
      { status: 400 },
    );
  }
  if (images.length === 0 && !note.trim()) {
    return NextResponse.json(
      { error: "사진이나 메모 중 적어도 하나는 입력해 주세요." },
      { status: 400 },
    );
  }

  const imageBlocks: Anthropic.ImageBlockParam[] = [];
  let totalBytes = 0;
  for (const dataUrl of images) {
    const parsed = parseDataUrl(dataUrl);
    if (!parsed) {
      return NextResponse.json(
        { error: "사진 형식을 인식할 수 없어요." },
        { status: 400 },
      );
    }
    if (!ALLOWED_IMAGE_TYPES.has(parsed.mediaType)) {
      return NextResponse.json(
        { error: `지원하지 않는 이미지 형식이에요: ${parsed.mediaType}` },
        { status: 400 },
      );
    }
    totalBytes += parsed.byteLength;
    if (totalBytes > MAX_TOTAL_BYTES) {
      return NextResponse.json(
        { error: "전체 사진 용량이 너무 커요. 한 장당 5MB 이하로 줄여주세요." },
        { status: 400 },
      );
    }
    // Narrow to the four media types the Anthropic SDK accepts.
    const mt = parsed.mediaType === "image/jpg" ? "image/jpeg" : parsed.mediaType;
    imageBlocks.push({
      type: "image",
      source: {
        type: "base64",
        media_type: mt as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
        data: parsed.data,
      },
    });
  }

  const ageLabel = AGE_LABELS[age] ?? AGE_LABELS["3"];

  const userText = `[연령]
${ageLabel}

[활동명]
${activityName.trim() || "(미입력 — 사진과 메모로부터 추론)"}

[교사 메모]
${note.trim() || "(미입력 — 사진만 보고 추론)"}

위 정보와 첨부된 사진을 종합하여, 7개 섹션 모두 빠짐없이 한국 유치원·어린이집 표준 놀이기록을 작성해 주세요. JSON으로만 응답.

가이드라인 재확인:
- 사진에 보이는 어떤 식별 정보(이름표·명찰 등)도 옮겨 적지 말 것
- 진단·평가·낙인 표현 금지
- 모든 7개 필드(theme, flow, reactions, learning, support, extension, homeConnection)를 빠짐없이 채울 것`;

  const userContent: Anthropic.ContentBlockParam[] = [
    ...imageBlocks,
    { type: "text", text: userText },
  ];

  const client = new Anthropic();

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 4096,
      thinking: { type: "adaptive" },
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userContent }],
      output_config: {
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties: {
              theme: { type: "string" },
              flow: { type: "string" },
              reactions: { type: "string" },
              learning: { type: "string" },
              support: { type: "string" },
              extension: { type: "string" },
              homeConnection: { type: "string" },
            },
            required: [
              "theme",
              "flow",
              "reactions",
              "learning",
              "support",
              "extension",
              "homeConnection",
            ],
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

    let parsed: {
      theme: string;
      flow: string;
      reactions: string;
      learning: string;
      support: string;
      extension: string;
      homeConnection: string;
    };
    try {
      parsed = JSON.parse(textBlock.text);
    } catch {
      return NextResponse.json(
        { error: "AI 응답을 파싱하지 못했습니다. 다시 시도해 주세요." },
        { status: 502 },
      );
    }

    return NextResponse.json({ journal: parsed });
  } catch (e) {
    if (e instanceof Anthropic.APIError) {
      const message =
        e.status === 401
          ? "API 키가 유효하지 않습니다."
          : e.status === 429
            ? "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요."
            : e.status === 413
              ? "사진 용량이 너무 커요. 더 작은 사진을 사용해 주세요."
              : `AI 호출 중 오류가 발생했습니다 (${e.status}).`;
      return NextResponse.json({ error: message }, { status: e.status ?? 500 });
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "알 수 없는 오류" },
      { status: 500 },
    );
  }
}
