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
 * Auto-saves the charter to localStorage on change (debounced) and hydrates
 * from storage once on mount. Returns nothing — it is a side-effect hook.
 */
export function useFormPersistence() {
  const charter = useCharterStore((s) => s.charter);
  const setCharter = useCharterStore((s) => s.setCharter);
  const hydrated = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate once on mount.
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const persisted = loadPersistedCharter();
    if (persisted) setCharter(persisted);
  }, [setCharter]);

  // Debounced save on every charter change (after hydration).
  useEffect(() => {
    if (!hydrated.current) return;
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
