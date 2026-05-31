import { useEffect, useRef } from "react";
import { useCharterStore } from "@/stores/charterStore";
import { charterSchema } from "@/lib/validationSchemas";
import type { Charter } from "@/types/charter";

const STORAGE_KEY = "better-project:charter";
const DEBOUNCE_MS = 600;

/** Read a previously persisted charter from localStorage, if valid. */
export function loadPersistedCharter(): Charter | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = charterSchema.safeParse(JSON.parse(raw));
    return parsed.success ? (parsed.data as Charter) : null;
  } catch {
    return null;
  }
}

export function clearPersistedCharter(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Auto-saves the charter to localStorage on change (debounced).
 *
 * Note: this hook does NOT hydrate on mount. Restoring a saved draft is an
 * explicit user choice ("Resume draft" on the landing screen) so that picking
 * a fresh template or AI draft is never silently overwritten by stored data.
 */
export function useFormPersistence() {
  const charter = useCharterStore((s) => s.charter);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(charter));
      } catch {
        /* storage full or unavailable — skip */
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [charter]);
}
