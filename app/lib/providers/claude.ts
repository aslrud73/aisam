import Anthropic from "@anthropic-ai/sdk";
import type {
  AIProvider,
  GenerateOptions,
  GenerateResult,
} from "./types";
import { ProviderError } from "./types";

export class ClaudeProvider implements AIProvider {
  private client: Anthropic;

  constructor(apiKey: string, private model: string) {
    this.client = new Anthropic({ apiKey });
  }

  async generate(opts: GenerateOptions): Promise<GenerateResult> {
    const userContent: Anthropic.ContentBlockParam[] = [];

    if (opts.images?.length) {
      for (const img of opts.images) {
        userContent.push({
          type: "image",
          source: {
            type: "base64",
            media_type: img.mediaType,
            data: img.data,
          },
        });
      }
    }
    userContent.push({ type: "text", text: opts.userText });

    const params: Anthropic.MessageCreateParamsNonStreaming = {
      model: this.model,
      max_tokens: opts.maxTokens,
      system: [
        {
          type: "text",
          text: opts.systemPrompt,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [{ role: "user", content: userContent }],
    };

    // Adaptive thinking is supported on Opus 4.7 / 4.6 / Sonnet 4.6.
    // Haiku and older models would 400 — only enable for thinking-capable models.
    if (
      this.model.startsWith("claude-opus-4-7") ||
      this.model.startsWith("claude-opus-4-6") ||
      this.model.startsWith("claude-sonnet-4-6")
    ) {
      params.thinking = { type: "adaptive" };
    }

    if (opts.jsonSchema) {
      params.output_config = {
        format: {
          type: "json_schema",
          schema: opts.jsonSchema.schema,
        },
      };
    }

    let response: Anthropic.Message;
    try {
      response = await this.client.messages.create(params);
    } catch (e) {
      if (e instanceof Anthropic.APIError) {
        throw new ProviderError(
          mapAnthropicMessage(e),
          e.status ?? 500,
          e.status,
        );
      }
      throw e;
    }

    const textBlock = response.content.find(
      (b): b is Anthropic.TextBlock => b.type === "text",
    );
    if (!textBlock) {
      throw new ProviderError("Claude 응답이 비어 있습니다.", 502);
    }
    return { text: textBlock.text };
  }
}

function mapAnthropicMessage(e: InstanceType<typeof Anthropic.APIError>): string {
  if (e.status === 401) return "Claude API 키가 유효하지 않습니다.";
  if (e.status === 429) return "Claude 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.";
  if (e.status === 400) return `Claude 요청이 잘못되었습니다: ${e.message}`;
  return `Claude 호출 오류 (${e.status ?? "?"}): ${e.message}`;
}
