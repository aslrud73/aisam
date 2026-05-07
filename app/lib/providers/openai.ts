import OpenAI from "openai";
import type {
  AIProvider,
  GenerateOptions,
  GenerateResult,
} from "./types";
import { ProviderError } from "./types";

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor(apiKey: string, private model: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generate(opts: GenerateOptions): Promise<GenerateResult> {
    const userContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];

    if (opts.images?.length) {
      for (const img of opts.images) {
        userContent.push({
          type: "image_url",
          image_url: {
            url: `data:${img.mediaType};base64,${img.data}`,
          },
        });
      }
    }
    userContent.push({ type: "text", text: opts.userText });

    const params: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming = {
      model: this.model,
      max_completion_tokens: opts.maxTokens,
      messages: [
        { role: "system", content: opts.systemPrompt },
        { role: "user", content: userContent },
      ],
    };

    if (opts.jsonSchema) {
      params.response_format = {
        type: "json_schema",
        json_schema: {
          name: opts.jsonSchema.name,
          schema: opts.jsonSchema.schema,
          strict: true,
        },
      };
    }

    let response: OpenAI.Chat.Completions.ChatCompletion;
    try {
      response = await this.client.chat.completions.create(params);
    } catch (e) {
      if (e instanceof OpenAI.APIError) {
        throw new ProviderError(mapOpenAIMessage(e), e.status ?? 500, e.status);
      }
      throw e;
    }

    const text = response.choices[0]?.message?.content ?? "";
    if (!text) {
      throw new ProviderError("OpenAI 응답이 비어 있습니다.", 502);
    }
    return { text };
  }
}

function mapOpenAIMessage(e: InstanceType<typeof OpenAI.APIError>): string {
  if (e.status === 401) return "OpenAI API 키가 유효하지 않습니다.";
  if (e.status === 429) return "OpenAI 요청이 너무 많습니다 (또는 크레딧 부족). 잠시 후 다시 시도해 주세요.";
  if (e.status === 400) return `OpenAI 요청이 잘못되었습니다: ${e.message}`;
  return `OpenAI 호출 오류 (${e.status ?? "?"}): ${e.message}`;
}
