import {
  DEFAULT_STACK_LIMIT,
  STORAGE_KEY,
  STORAGE_VERSION,
  type StashDocumentV1,
  type StashEntry,
} from "./model";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function emptyDocument(): StashDocumentV1 {
  return { version: STORAGE_VERSION, sessions: {} };
}

function isFiniteTimestamp(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

export function isStashEntry(value: unknown): value is StashEntry {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.id === "string" &&
    entry.id.length > 0 &&
    typeof entry.text === "string" &&
    entry.text.length > 0 &&
    isFiniteTimestamp(entry.createdAt) &&
    isFiniteTimestamp(entry.updatedAt) &&
    entry.revision === 1
  );
}

export function migrateDocument(value: unknown): StashDocumentV1 | null {
  if (typeof value !== "object" || value === null) return null;
  const candidate = value as Record<string, unknown>;
  if (candidate.version !== STORAGE_VERSION) return null;
  if (
    typeof candidate.sessions !== "object" ||
    candidate.sessions === null ||
    Array.isArray(candidate.sessions)
  ) {
    return null;
  }

  const sessions: Record<string, readonly StashEntry[]> = {};
  for (const [sessionId, entries] of Object.entries(candidate.sessions)) {
    if (sessionId.length === 0 || !Array.isArray(entries)) continue;
    const valid = entries.filter(isStashEntry).slice(0, DEFAULT_STACK_LIMIT);
    if (valid.length > 0) sessions[sessionId] = valid;
  }
  return { version: STORAGE_VERSION, sessions };
}

export function readDocument(storage: StorageLike): StashDocumentV1 {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null) return emptyDocument();
    return migrateDocument(JSON.parse(raw)) ?? emptyDocument();
  } catch {
    return emptyDocument();
  }
}

/** Write before returning; callers must not mutate in-memory UI until this succeeds. */
export function writeDocument(
  storage: StorageLike,
  document: StashDocumentV1,
): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(document));
}

export function entriesFor(
  document: StashDocumentV1,
  sessionId: string,
): readonly StashEntry[] {
  return document.sessions[sessionId] ?? [];
}

export function withEntries(
  document: StashDocumentV1,
  sessionId: string,
  entries: readonly StashEntry[],
): StashDocumentV1 {
  const sessions = { ...document.sessions };
  if (entries.length === 0) delete sessions[sessionId];
  else sessions[sessionId] = entries;
  return { version: STORAGE_VERSION, sessions };
}

export function pushEntry(
  document: StashDocumentV1,
  sessionId: string,
  entry: StashEntry,
  limit = DEFAULT_STACK_LIMIT,
): StashDocumentV1 {
  return withEntries(
    document,
    sessionId,
    [entry, ...entriesFor(document, sessionId)].slice(0, limit),
  );
}

export function removeEntry(
  document: StashDocumentV1,
  sessionId: string,
  entryId: string,
): StashDocumentV1 {
  return withEntries(
    document,
    sessionId,
    entriesFor(document, sessionId).filter((entry) => entry.id !== entryId),
  );
}

/**
 * Persist the current draft alongside the target before replacing the composer.
 * If the stack is full, evict the oldest non-target item so both texts remain recoverable.
 */
export function prepareSwap(
  document: StashDocumentV1,
  sessionId: string,
  current: StashEntry,
  targetId: string,
  limit = DEFAULT_STACK_LIMIT,
): StashDocumentV1 {
  const old = entriesFor(document, sessionId);
  const target = old.find((entry) => entry.id === targetId);
  if (target === undefined) throw new Error("stash-target-missing");
  const others = old.filter((entry) => entry.id !== targetId);
  const keptOthers = others.slice(0, Math.max(0, limit - 2));
  return withEntries(document, sessionId, [current, ...keptOthers, target]);
}

/**
 * Stage a shortcut rotation without losing either the current composer text or
 * the next target. After the composer is updated, callers remove `targetId`,
 * leaving the current item at the back of the rotation queue.
 */
export function prepareRotation(
  document: StashDocumentV1,
  sessionId: string,
  current: StashEntry,
  targetId: string,
  limit = DEFAULT_STACK_LIMIT,
): StashDocumentV1 {
  if (limit < 2) throw new Error("stash-rotation-limit-too-small");
  const old = entriesFor(document, sessionId);
  const target = old.find((entry) => entry.id === targetId);
  if (target === undefined) throw new Error("stash-target-missing");
  const others = old.filter((entry) => entry.id !== targetId);
  const keptOthers = others.slice(0, Math.max(0, limit - 2));
  return withEntries(document, sessionId, [...keptOthers, current, target]);
}
