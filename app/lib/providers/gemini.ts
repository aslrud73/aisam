import { GoogleGenAI, type Content, type Schema } from "@google/genai";
import type {
  AIProvider,
  GenerateOptions,
  GenerateResult,
} from "./types";
import { ProviderError } from "./types";

// Gemini supports a restricted JSON schema dialect. It does not understand
// `additionalProperties`, `$schema`, `definitions`, `$ref`, etc. Strip
// recursively before sending.
function sanitizeSchemaForGemini(schema: unknown): unknown {
  if (Array.isArray(schema)) {
    return schema.map(sanitizeSchemaForGemini);
  }
  if (schema && typeof schema === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(schema)) {
      if (
        k === "additionalProperties" ||
        k === "$schema" ||
        k === "definitions" ||
        k === "$ref" ||
        k === "$defs"
      ) {
        continue;
      }
      out[k] = sanitizeSchemaForGemini(v);
    }
    return out;
  }
  return schema;
}

export class GeminiProvider implements AIProvider {
  private client: GoogleGenAI;

  constructor(apiKey: string, private model: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async generate(opts: GenerateOptions): Promise<GenerateResult> {
    const parts: Content["parts"] = [];

    if (opts.images?.length) {
      for (const img of opts.images) {
        parts.push({
          inlineData: { mimeType: img.mediaType, data: img.data },
        });
      }
    }
    parts.push({ text: opts.userText });

    const config: Record<string, unknown> = {
      systemInstruction: opts.systemPrompt,
      maxOutputTokens: opts.maxTokens,
    };

    if (opts.jsonSchema) {
      config.responseMimeType = "application/json";
      config.responseSchema = sanitizeSchemaForGemini(
        opts.jsonSchema.schema,
      ) as Schema;
    }

    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: [{ role: "user", parts }],
        config,
      });

      const text = response.text ?? "";
      if (!text) {
        throw new ProviderError("Gemini 응답이 비어 있습니다.", 502);
      }
      return { text };
    } catch (e) {
      if (e instanceof ProviderError) throw e;
      const message = e instanceof Error ? e.message : "알 수 없는 오류";
      // Gemini SDK throws plain errors; sniff status codes from message.
      const status = parseGeminiStatus(message);
      throw new ProviderError(mapGeminiMessage(message, status), status);
    }
  }
}

function parseGeminiStatus(message: string): number {
  const m = message.match(/\b(4\d\d|5\d\d)\b/);
  if (m) return Number(m[1]);
  if (/api[_ ]?key/i.test(message)) return 401;
  if (/quota|rate/i.test(message)) return 429;
  return 500;
}

function mapGeminiMessage(message: string, status: number): string {
  if (status === 401 || status === 403)
    return "Gemini API 키가 유효하지 않거나 권한이 없습니다.";
  if (status === 429) return "Gemini 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.";
  if (status === 400) return `Gemini 요청이 잘못되었습니다: ${message}`;
  return `Gemini 호출 오류 (${status}): ${message}`;
}
