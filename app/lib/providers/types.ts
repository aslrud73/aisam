export type ProviderId = "claude" | "openai" | "gemini";

export interface ImageInput {
  mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  data: string; // base64 (no data:URL prefix)
}

export interface JSONSchemaSpec {
  name: string;
  schema: Record<string, unknown>;
}

export interface GenerateOptions {
  systemPrompt: string;
  userText: string;
  images?: ImageInput[];
  maxTokens: number;
  jsonSchema?: JSONSchemaSpec;
}

export interface GenerateResult {
  text: string;
}

export interface AIProvider {
  generate(opts: GenerateOptions): Promise<GenerateResult>;
}

export class ProviderError extends Error {
  constructor(
    message: string,
    public status: number = 500,
    public providerStatus?: number,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

export interface ModelChoice {
  id: string;
  label: string;
  note?: string;
}

export const DEFAULT_MODELS: Record<ProviderId, string> = {
  claude: "claude-sonnet-4-6",
  openai: "gpt-4o-mini",
  gemini: "gemini-2.0-flash",
};

export const MODEL_CHOICES: Record<ProviderId, ModelChoice[]> = {
  claude: [
    { id: "claude-sonnet-4-6", label: "Sonnet 4.6", note: "균형형 (추천)" },
    { id: "claude-opus-4-7", label: "Opus 4.7", note: "최고 품질, 비쌈" },
    { id: "claude-haiku-4-5", label: "Haiku 4.5", note: "빠르고 저렴" },
  ],
  openai: [
    { id: "gpt-4o-mini", label: "GPT-4o mini", note: "저렴 (추천)" },
    { id: "gpt-4o", label: "GPT-4o", note: "고품질" },
    { id: "gpt-4.1-mini", label: "GPT-4.1 mini", note: "최신 경량" },
    { id: "gpt-4.1", label: "GPT-4.1", note: "최신 고품질" },
  ],
  gemini: [
    { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", note: "빠르고 저렴 (추천)" },
    { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", note: "균형형" },
    { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", note: "고품질" },
  ],
};

export const PROVIDER_LABELS: Record<ProviderId, string> = {
  claude: "Anthropic Claude",
  openai: "OpenAI",
  gemini: "Google Gemini",
};
