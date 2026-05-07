import type { AIProvider, ProviderId } from "./types";
import { ProviderError, DEFAULT_MODELS } from "./types";
import { ClaudeProvider } from "./claude";
import { OpenAIProvider } from "./openai";
import { GeminiProvider } from "./gemini";

export function createProvider(
  provider: ProviderId,
  apiKey: string,
  model?: string,
): AIProvider {
  if (!apiKey || !apiKey.trim()) {
    throw new ProviderError(
      "API 키가 설정되어 있지 않아요. 우측 상단 '설정'에서 API 키를 먼저 등록해 주세요.",
      400,
    );
  }
  const m = model && model.trim() ? model.trim() : DEFAULT_MODELS[provider];
  switch (provider) {
    case "claude":
      return new ClaudeProvider(apiKey, m);
    case "openai":
      return new OpenAIProvider(apiKey, m);
    case "gemini":
      return new GeminiProvider(apiKey, m);
    default:
      throw new ProviderError(`알 수 없는 프로바이더: ${provider}`, 400);
  }
}

export interface ParsedAuth {
  provider: ProviderId;
  apiKey: string;
  model: string;
}

/**
 * Read provider/key/model from request headers. We use headers (not body) so
 * the same call shape works for every API route without each route having to
 * thread the same fields through its body schema.
 */
export function parseAuth(req: Request): ParsedAuth {
  const provider = (req.headers.get("x-ai-provider") || "").trim() as ProviderId;
  const apiKey = (req.headers.get("x-ai-api-key") || "").trim();
  const model = (req.headers.get("x-ai-model") || "").trim();
  if (provider !== "claude" && provider !== "openai" && provider !== "gemini") {
    throw new ProviderError(
      "프로바이더가 올바르지 않습니다. 설정에서 프로바이더를 선택해 주세요.",
      400,
    );
  }
  if (!apiKey) {
    throw new ProviderError(
      "API 키가 설정되어 있지 않아요. 우측 상단 '설정'에서 API 키를 먼저 등록해 주세요.",
      400,
    );
  }
  return { provider, apiKey, model: model || DEFAULT_MODELS[provider] };
}

export * from "./types";
