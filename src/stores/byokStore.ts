/**
 * BYOK (bring-your-own-key) settings store.
 *
 * Stored in localStorage on the user's browser ONLY — never sent to any
 * server we operate. When a key is present, the app routes AI calls
 * directly from the browser to the user's chosen provider.
 *
 * Privacy notes (intentional):
 *   - Key, model, and provider live exclusively in localStorage under
 *     "better-project:byok". localStorage is origin-scoped.
 *   - We never log, fetch, or otherwise transmit these values to our infra.
 *   - The "clear" action wipes both the in-memory store and the persisted
 *     entry.
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AiProvider, ByokConfig } from "@/services/ai/clientAi";

interface ByokState {
  provider: AiProvider;
  apiKey: string;
  model: string;
  /** Optional override for OpenAI-compatible endpoints. */
  baseUrl: string;

  setProvider: (p: AiProvider) => void;
  setApiKey: (k: string) => void;
  setModel: (m: string) => void;
  setBaseUrl: (u: string) => void;
  save: (cfg: Omit<ByokConfig, never>) => void;
  clear: () => void;
}

const DEFAULTS = {
  provider: "gemini" as AiProvider,
  apiKey: "",
  model: "gemini-2.5-flash",
  baseUrl: "",
};

export const useByokStore = create<ByokState>()(
  persist(
    (set) => ({
      ...DEFAULTS,

      setProvider: (p) => set({ provider: p }),
      setApiKey: (k) => set({ apiKey: k }),
      setModel: (m) => set({ model: m }),
      setBaseUrl: (u) => set({ baseUrl: u }),

      save: (cfg) =>
        set({
          provider: cfg.provider,
          apiKey: cfg.apiKey,
          model: cfg.model,
          baseUrl: cfg.baseUrl ?? "",
        }),

      clear: () => set({ ...DEFAULTS }),
    }),
    {
      name: "better-project:byok",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/** Read the current BYOK config OUTSIDE React. Returns null if no key is set. */
export function getActiveByokConfig(): ByokConfig | null {
  const s = useByokStore.getState();
  if (!s.apiKey.trim() || !s.model.trim()) return null;
  return {
    provider: s.provider,
    apiKey: s.apiKey.trim(),
    model: s.model.trim(),
    baseUrl: s.baseUrl.trim() || undefined,
  };
}

/** Suggested default model per provider — shown when switching in the UI. */
export const DEFAULT_MODEL_BY_PROVIDER: Record<AiProvider, string> = {
  gemini: "gemini-2.5-flash",
  openai: "gpt-4o-mini",
  anthropic: "claude-haiku-4-5",
};

export const PROVIDER_LABEL: Record<AiProvider, string> = {
  gemini: "Google Gemini",
  openai: "OpenAI (or compatible)",
  anthropic: "Anthropic Claude",
};
