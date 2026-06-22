/**
 * Multi-charter persistence layer.
 *
 * Storage model:
 *   better-project:charter-index   → CharterIndexEntry[] (sorted by updatedAt desc)
 *   better-project:charter:<id>    → full Charter JSON
 *
 * The single-charter key from the original app (better-project:charter) is
 * auto-migrated into the index on first read so existing users don't lose
 * their work.
 */
import type { Charter } from "@/types/charter";
import { createEmptyCharter } from "@/stores/charterStore";

const INDEX_KEY = "better-project:charter-index";
const CHARTER_KEY_PREFIX = "better-project:charter:";
const LEGACY_KEY = "better-project:charter";

/**
 * Permissively coerce an arbitrary JSON value into a Charter shape.
 *
 * Persistence MUST NOT use the strict export-gating schema (`charterSchema`)
 * — that schema requires every required field to be populated, so any
 * in-progress draft fails validation and load returns null. Instead, accept
 * whatever structure is present and backfill missing fields from an empty
 * template so the editor opens to whatever the user actually had.
 */
function coerceCharter(raw: unknown): Charter | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  // Require at least a stable id — without it we can't key the library entry.
  if (typeof r.id !== "string" || r.id.length === 0) return null;

  const empty = createEmptyCharter();
  const merge = <K extends keyof Charter>(k: K): Charter[K] => {
    const v = r[k as string];
    if (v && typeof v === "object" && !Array.isArray(v)) {
      return { ...(empty[k] as object), ...(v as object) } as Charter[K];
    }
    return empty[k];
  };

  return {
    id: r.id,
    templateId: typeof r.templateId === "string" ? r.templateId : null,
    createdAt: typeof r.createdAt === "string" ? r.createdAt : empty.createdAt,
    updatedAt: typeof r.updatedAt === "string" ? r.updatedAt : empty.updatedAt,
    basics: merge("basics"),
    goals: merge("goals"),
    stakeholders: merge("stakeholders"),
    scope: merge("scope"),
    risks: merge("risks"),
    deliverables: merge("deliverables"),
    timeline: merge("timeline"),
  };
}

export interface CharterIndexEntry {
  id: string;
  projectName: string;
  templateId: string | null;
  updatedAt: string;
  createdAt: string;
}

function readIndex(): CharterIndexEntry[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CharterIndexEntry[]) : [];
  } catch {
    return [];
  }
}

function writeIndex(entries: CharterIndexEntry[]): void {
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(entries));
  } catch {
    /* storage full or unavailable */
  }
}

function charterKey(id: string): string {
  return `${CHARTER_KEY_PREFIX}${id}`;
}

/**
 * One-time migration: if a legacy single-charter key exists and the index is
 * empty, lift it into the new multi-charter format.
 */
function migrateLegacyIfNeeded(): void {
  if (readIndex().length > 0) return;
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (!raw) return;
    const charter = coerceCharter(JSON.parse(raw));
    if (!charter) return;
    saveCharter(charter);
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    /* migration is best-effort */
  }
}

/** Return the list of saved charters, newest first. Auto-migrates on first call. */
export function listCharters(): CharterIndexEntry[] {
  migrateLegacyIfNeeded();
  return readIndex().sort((a, b) =>
    a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0,
  );
}

export function loadCharter(id: string): Charter | null {
  try {
    const raw = localStorage.getItem(charterKey(id));
    if (!raw) return null;
    return coerceCharter(JSON.parse(raw));
  } catch {
    return null;
  }
}

/** Save a charter and update its index entry. */
export function saveCharter(charter: Charter): void {
  try {
    localStorage.setItem(charterKey(charter.id), JSON.stringify(charter));
    const index = readIndex();
    const entry: CharterIndexEntry = {
      id: charter.id,
      projectName: charter.basics.projectName.trim() || "Untitled charter",
      templateId: charter.templateId,
      updatedAt: charter.updatedAt,
      createdAt: charter.createdAt,
    };
    const existing = index.findIndex((e) => e.id === charter.id);
    if (existing >= 0) {
      index[existing] = entry;
    } else {
      index.push(entry);
    }
    writeIndex(index);
  } catch {
    /* storage full or unavailable */
  }
}

export function deleteCharter(id: string): void {
  try {
    localStorage.removeItem(charterKey(id));
    const index = readIndex().filter((e) => e.id !== id);
    writeIndex(index);
  } catch {
    /* ignore */
  }
}

export function renameCharter(id: string, newName: string): void {
  const charter = loadCharter(id);
  if (!charter) return;
  const updated: Charter = {
    ...charter,
    basics: { ...charter.basics, projectName: newName },
    updatedAt: new Date().toISOString(),
  };
  saveCharter(updated);
}
