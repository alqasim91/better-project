import { useEffect, useRef } from "react";
import { useCharterStore } from "@/stores/charterStore";
import type { Charter } from "@/types/charter";
import {
  saveCharter,
  loadCharter,
  listCharters,
  deleteCharter,
} from "@/lib/charterLibrary";

const DEBOUNCE_MS = 600;

/**
 * Return the most-recently-edited charter, if any. Used by the landing
 * screen's "Resume draft" affordance. Reads through the library so legacy
 * single-charter data is migrated transparently.
 */
export function loadPersistedCharter(): Charter | null {
  const all = listCharters();
  if (all.length === 0) return null;
  return loadCharter(all[0].id);
}

/**
 * Delete the most-recently-edited charter from the library. Used by the
 * landing-page "Discard draft" affordance — the in-memory store at that
 * point is a fresh blank charter (different id), so we target the saved
 * draft directly by recency.
 */
export function clearPersistedCharter(): void {
  const all = listCharters();
  if (all.length > 0) deleteCharter(all[0].id);
}

/**
 * Auto-saves the charter to the library on change (debounced).
 *
 * Does NOT hydrate on mount — restoring a saved charter is an explicit user
 * choice (Resume / Open from library) so a fresh AI draft or new template
 * never silently overwrites stored data.
 */
export function useFormPersistence() {
  const charter = useCharterStore((s) => s.charter);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      saveCharter(charter);
    }, DEBOUNCE_MS);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [charter]);
}
