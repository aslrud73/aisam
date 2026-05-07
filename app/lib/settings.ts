"use client";

import {
  DEFAULT_MODELS,
  MODEL_CHOICES,
  type ProviderId,
} from "./providers/types";

export interface AISettings {
  provider: ProviderId;
  apiKey: string;
  model: string;
}

const STORAGE_KEY = "oneul-ai-settings-v1";

export function loadSettings(): AISettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AISettings>;
    if (
      parsed.provider !== "claude" &&
      parsed.provider !== "openai" &&
      parsed.provider !== "gemini"
    ) {
      return null;
    }
    return {
      provider: parsed.provider,
      apiKey: parsed.apiKey ?? "",
      model: parsed.model || DEFAULT_MODELS[parsed.provider],
    };
  } catch {
    return null;
  }
}

export function saveSettings(s: AISettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export function clearSettings() {
  localStorage.removeItem(STORAGE_KEY);
}

export function isConfigured(): boolean {
  const s = loadSettings();
  return Boolean(s && s.apiKey.trim());
}

export function getAuthHeaders(): Record<string, string> {
  const s = loadSettings();
  if (!s || !s.apiKey.trim()) return {};
  return {
    "x-ai-provider": s.provider,
    "x-ai-api-key": s.apiKey,
    "x-ai-model": s.model || DEFAULT_MODELS[s.provider],
  };
}

export { DEFAULT_MODELS, MODEL_CHOICES };
export type { ProviderId };
