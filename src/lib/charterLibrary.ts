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
import { charterSchema } from "@/lib/validationSchemas";

const INDEX_KEY = "better-project:charter-index";
const CHARTER_KEY_PREFIX = "better-project:charter:";
const LEGACY_KEY = "better-project:charter";

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
    const parsed = charterSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return;
    const charter = parsed.data as Charter;
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
    const parsed = charterSchema.safeParse(JSON.parse(raw));
    return parsed.success ? (parsed.data as Charter) : null;
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
