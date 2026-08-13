import type { DshInputState } from "./dsh-types";

export const STORAGE_KEY = "dsh.promptStash.v1";
export const STORAGE_VERSION = 1 as const;
export const DEFAULT_STACK_LIMIT = 10;

export interface StashEntry {
  readonly id: string;
  readonly text: string;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly revision: 1;
}

export interface StashDocumentV1 {
  readonly version: 1;
  readonly sessions: Readonly<Record<string, readonly StashEntry[]>>;
}

export type StashBlockReason = "empty" | "busy" | "images" | "occurrences";

export interface StashEligibility {
  readonly allowed: boolean;
  readonly reason?: StashBlockReason;
}

export function canStash(
  input: Pick<DshInputState, "draft" | "phase" | "imageIds" | "occurrences">,
): StashEligibility {
  if (input.draft.trim() === "") return { allowed: false, reason: "empty" };
  if (input.phase !== "plain") return { allowed: false, reason: "busy" };
  if (input.imageIds.length > 0) return { allowed: false, reason: "images" };
  if (input.occurrences.length > 0)
    return { allowed: false, reason: "occurrences" };
  return { allowed: true };
}

export function composerHasContent(
  input: Pick<DshInputState, "draft" | "imageIds" | "occurrences">,
): boolean {
  return (
    input.draft.length > 0 ||
    input.imageIds.length > 0 ||
    input.occurrences.length > 0
  );
}

export function createEntry(
  text: string,
  now = Date.now(),
  id: string = crypto.randomUUID(),
): StashEntry {
  return { id, text, createdAt: now, updatedAt: now, revision: 1 };
}
